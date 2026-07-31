import sqlite3

# Create a test SQLite database with helloworld table
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Drop table if exists
cursor.execute('DROP TABLE IF EXISTS helloworld')

# Create table
cursor.execute('''
CREATE TABLE helloworld (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

# Insert 4 test entries
test_data = [
    (1, 'Entry 1', 'Hello from SQLite - Entry 1'),
    (2, 'Entry 2', 'Hello from SQLite - Entry 2'),
    (3, 'Entry 3', 'Hello from SQLite - Entry 3'),
    (4, 'Entry 4', 'Hello from SQLite - Entry 4')
]

cursor.executemany('INSERT INTO helloworld (id, name, message) VALUES (?, ?, ?)', test_data)

conn.commit()
conn.close()

print("Test database created successfully with 4 entries!")
