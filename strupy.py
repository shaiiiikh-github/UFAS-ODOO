import os

def create_structure():
    # Define the directory tree
    directories = [
        "app",
        "app/core",
        "app/models",
    ]

    # Define the files to create
    files = [
        ".env",
        ".env.example",
        "requirements.txt",
        "seed.py",
        "app/__init__.py",
        "app/main.py",
        "app/schemas.py",
        "app/services.py",
        "app/core/__init__.py",
        "app/core/config.py",
        "app/core/database.py",
        "app/models/__init__.py",
        "app/models/base.py",
        "app/models/accounting.py",
        "app/models/domain.py",
    ]

    # Create directories
    print("Creating directories...")
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"  + Created directory: {directory}/")

    # Create empty files
    print("\nCreating empty files...")
    for file_path in files:
        if not os.path.exists(file_path):
            with open(file_path, "w") as f:
                pass # Just create an empty file
            print(f"  + Created file: {file_path}")
        else:
            print(f"  - Skipped (already exists): {file_path}")

    print("\n✅ Project scaffolding complete!")
    print("Next step: Initialize alembic using 'alembic init -t async alembic'")

if __name__ == "__main__":
    create_structure()