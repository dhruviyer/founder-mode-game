from time import sleep
from dev_agent import DevAgent
import pika, threading
from admin import Admin
import datetime

connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
channel = connection.channel()

channel.exchange_declare(exchange="broker", exchange_type="topic")

admin = Admin()
bob = DevAgent("Bob")
alice = DevAgent("Alice")

bob.thread.start()
alice.thread.start()
admin.thread.start()

def tick():
    tick_counter = 0
    while tick_counter<20:
        sleep(5)
        channel.basic_publish(exchange='broker', routing_key="tick", body=str(datetime.datetime.now()))
        tick_counter = tick_counter + 1

thread = threading.Thread(target=tick)
thread.start()
thread.join()
