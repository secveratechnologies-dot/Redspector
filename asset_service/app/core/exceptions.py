class ObjectNotFoundException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class ObjectAlreadyExistsException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
