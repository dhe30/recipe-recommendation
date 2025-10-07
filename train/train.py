import psycopg2
import os
import numpy as np
from dotenv import load_dotenv
load_dotenv()
url = os.getenv("DB_CONN")
conn = psycopg2.connect({url})

cur = conn.cursor()

def get_feedback(): 
    cur.execute("SELECT user_id, item_id, embedding FROM feedback")
    return cur.fetchall()

def get_user_item_matrices(): 
    cur.execute("SELECT * FROM users")
    users = cur.fetchall()
    cur.execute("SELECT * FROM items")
    items = cur.fetchall()
    return (dict(users), dict(items))

def sgd(users, items, feedback): 

