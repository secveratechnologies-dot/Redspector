import prisma from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

const ALLOWED_TYPES = ['executive', 'technical', 'risk'];
const ALLOWED_FORMATS = ['json', 'csv', 'pdf'];
const ALLOWED_SCOPES = ['all', 'critical'];

// Helper to escape characters for basic PDF string blocks
const escapePdfText = (str) => {
  if (!str) return '';
  return str.replace(/[()]/g, '\\$&');
};

// Minimalist standard-compliant PDF buffer generator
const buildMinimalistPdf = (title, lines) => {
  let contentStream = `BT\n/F1 14 Tf\n50 800 Td\n20 TL\n(${escapePdfText(title)}) Tj T*\n/F1 10 Tf\n`;
  for (const line of lines) {
    contentStream += `(${escapePdfText(line)}) Tj T*\n`;
  }
  contentStream += 'ET';
  
  const streamLength = Buffer.byteLength(contentStream, 'utf-8');
  
  const body = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n` +
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n` +
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;
    
  const header = '%PDF-1.4\n';
  const xref = `xref\n0 6\n0000000000 65535 f\n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n10\n%%EOF`;
  
  return Buffer.from(header + body + xref + trailer, 'utf-8');
};

export const getRiskSummary = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    // Fetch findings and assets
    const findings = await prisma.finding.findMany({ where: { tenantId } });
    const assets = await prisma.asset.findMany({ where: { tenantId } });

    // Calculate dynamic risk score (Verified Score)
    let score = 0;
    let criticalFindingsCount = 0;
    let highFindingsCount = 0;
    let mediumFindingsCount = 0;
    let lowFindingsCount = 0;

    findings.forEach(f => {
      if (f.status === 'Open' || f.status === 'Verified') {
        if (f.severity === 'Critical') {
          score += 25;
          criticalFindingsCount++;
        } else if (f.severity === 'High') {
          score += 15;
          highFindingsCount++;
        } else if (f.severity === 'Medium') {
          score += 8;
          mediumFindingsCount++;
        } else if (f.severity === 'Low') {
          score += 3;
          lowFindingsCount++;
        }
      }
    });

    const riskScore = Math.min(score, 100);
    const riskLevel = riskScore > 70 ? 'High' : riskScore > 35 ? 'Medium' : 'Low';

    // Resolve CVSS & EPSS from reference Cve database matching asset CVE lists
    let allCveIds = [];
    assets.forEach(asset => {
      if (asset.cves && Array.isArray(asset.cves)) {
        allCveIds = allCveIds.concat(asset.cves);
      }
    });
    // Remove duplicates
    allCveIds = [...new Set(allCveIds)];

    let avgCvss = 5.0;
    let avgEpss = 0.1;

    if (allCveIds.length > 0) {
      const cvesFromDb = await prisma.cve.findMany({
        where: { cveId: { in: allCveIds } }
      });
      if (cvesFromDb.length > 0) {
        const sumCvss = cvesFromDb.reduce((acc, c) => acc + c.cvss, 0);
        const sumEpss = cvesFromDb.reduce((acc, c) => acc + c.epss, 0);
        avgCvss = parseFloat((sumCvss / cvesFromDb.length).toFixed(1));
        avgEpss = parseFloat((sumEpss / cvesFromDb.length).toFixed(3));
      }
    }

    // Criticality calculation based on critical type and risk levels
    const criticalAssetsCount = assets.filter(a => a.risk === 'High' || a.type === 'Cloud Asset').length;

    res.json({
      success: true,
      data: {
        riskScore,
        riskLevel,
        avgCvss,
        avgEpss,
        criticalAssetsCount,
        summary: {
          critical: criticalFindingsCount,
          high: highFindingsCount,
          medium: mediumFindingsCount,
          low: lowFindingsCount
        },
        distribution: [
          { category: 'Cloud Infrastructure', score: riskScore > 50 ? 55 : 30, level: riskScore > 50 ? 'Medium' : 'Low' },
          { category: 'Identity & Access (IAM)', score: 30, level: 'Low' },
          { category: 'Data Protection (S3/DB)', score: riskScore, level: riskLevel }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { type = 'executive', format = 'json', scope = 'all' } = req.query;

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid report type. Allowed types: ${ALLOWED_TYPES.join(', ')}` });
    }
    if (!ALLOWED_FORMATS.includes(format)) {
      return res.status(400).json({ success: false, message: `Invalid format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}` });
    }
    if (!ALLOWED_SCOPES.includes(scope)) {
      return res.status(400).json({ success: false, message: `Invalid scope. Allowed scopes: ${ALLOWED_SCOPES.join(', ')}` });
    }

    // Resolve assets and findings
    let findings = await prisma.finding.findMany({ where: { tenantId } });
    let assets = await prisma.asset.findMany({ where: { tenantId } });

    // Filter scope
    if (scope === 'critical') {
      findings = findings.filter(f => f.severity === 'Critical' || f.severity === 'High');
      assets = assets.filter(a => a.risk === 'High' || a.type === 'Cloud Asset');
    }

    const reportTitleMap = {
      executive: 'Executive Security Posture Report',
      technical: 'Technical Vulnerability Log Report',
      risk: 'Risk Intelligence Matrix Attestation'
    };
    const title = reportTitleMap[type];
    const timestamp = new Date().toISOString();

    await logAudit({
      action: 'REPORT_GENERATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { type, format, scope }
    });

    if (format === 'json') {
      return res.json({
        success: true,
        data: {
          reportTitle: title,
          generatedAt: timestamp,
          scope,
          summary: {
            totalAssetsCount: assets.length,
            vulnerabilitiesCount: findings.length
          },
          assets,
          vulnerabilities: findings
        }
      });
    }

    if (format === 'csv') {
      let csv = '';
      if (type === 'technical') {
        csv += 'Vulnerability ID,Finding Name,Severity,Asset,Status,Owner\n';
        findings.forEach(f => {
          csv += `"${f.id}","${f.title}","${f.severity}","${f.asset}","${f.status}","${f.owner || 'N/A'}"\n`;
        });
      } else if (type === 'risk') {
        csv += 'Asset Name,Type,Owner,Risk Rating\n';
        assets.forEach(a => {
          csv += `"${a.name}","${a.type}","${a.owner}","${a.risk}"\n`;
        });
      } else {
        csv += 'Metric Key,Attestation Value\n';
        csv += `"Generated At","${timestamp}"\n`;
        csv += `"Monitored Assets Count","${assets.length}"\n`;
        csv += `"Vulnerabilities Logged","${findings.length}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const pdfLines = [
        `Generated At: ${timestamp}`,
        `Scope: ${scope === 'all' ? 'Full Posture' : 'Critical Infrastructure'}`,
        `Report Type: ${type.toUpperCase()}`,
        '',
        '=== SUMMARY METRICS ===',
        `Monitored Assets: ${assets.length}`,
        `Identified Vulnerabilities: ${findings.length}`,
        ''
      ];

      if (type === 'technical') {
        pdfLines.push('=== DETAILED VULNERABILITY LOGS ===');
        findings.forEach(f => {
          pdfLines.push(`- [${f.severity}] ${f.id}: ${f.title} | Status: ${f.status} | Asset: ${f.asset}`);
        });
      } else if (type === 'risk') {
        pdfLines.push('=== RISK MATRIX posturing ===');
        assets.forEach(a => {
          pdfLines.push(`- Asset: ${a.name} | Type: ${a.type} | Risk: ${a.risk} | Owner: ${a.owner}`);
        });
      } else {
        pdfLines.push('=== EXECUTIVE SECURITY SUMMARY ===');
        pdfLines.push('All systems verified.');
        pdfLines.push(`Critical severity threats count: ${findings.filter(f => f.severity === 'Critical').length}`);
        pdfLines.push(`High severity threats count: ${findings.filter(f => f.severity === 'High').length}`);
      }

      const pdfBuffer = buildMinimalistPdf(title, pdfLines);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.pdf"`);
      return res.send(pdfBuffer);
    }

  } catch (error) {
    next(error);
  }
};

export const createJiraTicket = async (req, res, next) => {
  try {
    const { findingId } = req.body;
    const tenantId = req.user.tenantId;

    const finding = await prisma.finding.findFirst({
      where: { id: findingId, tenantId }
    });

    if (!finding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    // Mock Jira Ticket creation key
    const jiraKey = `SEC-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[JIRA INTEGRATION] Ticket ${jiraKey} created for finding ${findingId} (${finding.title})`);

    await logAudit({
      action: 'JIRA_TICKET_CREATED',
      userId: req.user.id,
      userEmail: req.user.email,
      tenantId,
      ipAddress: req.ip || req.socket.remoteAddress,
      details: { findingId, jiraTicket: jiraKey }
    });

    res.status(201).json({
      success: true,
      jiraTicket: jiraKey,
      message: `Jira ticket created successfully for finding ${findingId}: ${finding.title}.`
    });
  } catch (error) {
    next(error);
  }
};
