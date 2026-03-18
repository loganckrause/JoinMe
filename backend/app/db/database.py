from sqlmodel import Field, SQLModel, create_engine, Session

# Replace with your actual MySQL credentials and details
mysql_url = "mysql+mysqlconnector://root:your_password@localhost:3306/your_db"

engine = create_engine(mysql_url, echo=True)


def create_db_and_tables():
    # Creates all tables defined as SQLModel subclasses
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    create_db_and_tables()
    # You can now use sessions with this engine to perform CRUD operations
    with Session(engine) as session:
        # ... database operations ...
        pass
