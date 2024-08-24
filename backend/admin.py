import pika
import threading
import json
import random
import string


class Admin:
    def __init__(self):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host="localhost")
        )
        self.channel = self.connection.channel()

        result = self.channel.queue_declare("", exclusive=True)
        queue_name = result.method.queue

        self.channel.queue_bind(
            exchange="broker", queue=queue_name, routing_key="admin.#"
        )

        self.work_queue = {}

        def callback(ch, method, properties, body):
            routing_key = method.routing_key.split(".")

            if len(routing_key) == 1:
                message = json.loads(body.decode("ascii"))["message"].split(" ")
                if len(message) == 2:
                    if message[1] in self.work_queue:
                        if message[0] == "confirm":
                            self.work_queue[message[1]]()
                        del self.work_queue[message[1]]
            else:
                function = routing_key[1]

                if function == "set_focus":
                    args = json.loads(body.decode("ascii"))
                    employee = args["employee"]
                    focus = args["focus"]

                elif function == "change_employment":
                    args = json.loads(body.decode("ascii"))
                    employee = args["employee"]
                    new_employer = args["employer"]
                    manager = args["manager"]
                    salary = int(args["salary"])

                    if new_employer == "unemployed":
                        self.channel.basic_publish(
                            exchange="broker",
                            routing_key=f"{employee}.admin.confirm_employment",
                            body=body,
                        )
                    else:
                        routing_key = f"{manager}.admin"
                        confirmation_code = "".join(
                            random.choice(string.ascii_lowercase) for _ in range(5)
                        )

                        def confirm():
                            self.channel.basic_publish(
                                exchange="broker",
                                routing_key=f"{employee}.admin.confirm_employment",
                                body=body,
                            )

                        self.work_queue[confirmation_code] = confirm
                        self.channel.basic_publish(
                            exchange="broker",
                            routing_key=routing_key,
                            body=json.dumps(
                                {
                                    "sender": "admin",
                                    "message": f"Do you want to hire {employee} at {new_employer} for a salary of {salary}? Send me back the word 'confirm' or 'deny' and this confirmation code: {confirmation_code}",
                                }
                            ),
                        )

        self.channel.basic_consume(
            queue=queue_name, on_message_callback=callback, auto_ack=True
        )

        def thread_function():
            self.channel.start_consuming()

        self.thread = threading.Thread(target=thread_function)
