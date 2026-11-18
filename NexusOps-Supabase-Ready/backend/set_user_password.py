from getpass import getpass

from sqlalchemy import func, select

from app.auth import hash_password
from app.database import SessionLocal
from app.models import User


def main() -> None:
    email = input("E-mail du compte à configurer : ").strip().casefold()
    password = getpass("Nouveau mot de passe (12 caractères minimum) : ")
    confirmation = getpass("Confirmez le mot de passe : ")

    if len(password) < 12:
        raise SystemExit("Le mot de passe doit contenir au moins 12 caractères.")
    if password != confirmation:
        raise SystemExit("Les mots de passe ne correspondent pas.")

    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(func.lower(User.email) == email)
        )
        if user is None:
            raise SystemExit("Aucun compte correspondant dans directory_users.")
        user.password_hash = hash_password(password)
        db.commit()

    print(f"Mot de passe configuré pour {email}.")


if __name__ == "__main__":
    main()
