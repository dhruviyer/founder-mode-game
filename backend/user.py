import pika
import json

connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
channel = connection.channel()

channel.exchange_declare(exchange="broker", exchange_type="topic")

username = input("Enter your username: ")

while True:
    msg = input("#> ").split(" ", 1)
    routing_key = msg[0].lower()
    message = msg[1]
    if routing_key.startswith("/"):
        routing_key = routing_key[1:]

    message = json.dumps({"sender": username, "message": message})
    channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)
