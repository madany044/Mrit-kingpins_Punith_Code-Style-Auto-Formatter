from flask import Blueprint

from .auth import auth_bp
from .lint import lint_bp
from .suggestion import suggestion_bp

api_bp = Blueprint("api", __name__)
api_bp.register_blueprint(auth_bp)
api_bp.register_blueprint(lint_bp)
api_bp.register_blueprint(suggestion_bp)

