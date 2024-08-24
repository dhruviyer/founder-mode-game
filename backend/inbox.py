import pika

connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
channel = connection.channel()

result = channel.queue_declare("", exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange="broker", queue=queue_name, routing_key="#")


def callback(ch, method, properties, body):
    message = body.decode("ascii")
    print(f"#> [{method.routing_key}] {message}")


channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

channel.start_consuming()
