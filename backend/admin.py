import pika
import threading
import json
import random
import string
import sqlite3
import locale

class Admin:
    def __init__(self):
        locale.setlocale( locale.LC_ALL, '' )
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
                    focus = args["focus"].upper()
                    
                    conn = sqlite3.connect('company_sim.db') 
                    cursor = conn.cursor() 

                    cursor.execute("UPDATE EMPLOYEE_OUTPUT set PRIORITY = ? where NAME = ?", (focus, employee)) 
                    conn.commit()
                    conn.close()

                    ch.basic_publish(
                        exchange="broker",
                        routing_key=f"data_broadcast",
                        body="",
                    )

                elif function == "change_employment":
                    args = json.loads(body.decode("ascii"))
                    employee = args["employee"]
                    new_employer = args["employer"].upper()
                    manager = args["manager"]
                    salary = int(args["salary"])

                    if new_employer == "UNEMPLOYED":
                        ch.basic_publish(
                            exchange="broker",
                            routing_key=f"{employee}.admin.confirm_employment",
                            body=body,
                        )
                        conn = sqlite3.connect('company_sim.db') 
                        cursor = conn.cursor() 

                        cursor.execute("""UPDATE EMPLOYEES set EMPLOYER = 'unemployed', SALARY = 0, MANAGER = 'NULL' where NAME = ?""", (employee,)) 
                        conn.commit()
                        conn.close()

                        ch.basic_publish(
                            exchange="broker",
                            routing_key=f"data_broadcast",
                            body="",
                        )

                    else:
                        routing_key = f"{manager}"
                        confirmation_code = "".join(
                            random.choice(string.ascii_lowercase) for _ in range(5)
                        )

                        def confirm():
                            ch.basic_publish(
                                exchange="broker",
                                routing_key=f"{employee}.admin.confirm_employment",
                                body=body,
                            )
                            conn = sqlite3.connect('company_sim.db') 
                            cursor = conn.cursor() 
            
                            cursor.execute("""UPDATE EMPLOYEES set EMPLOYER = ?, SALARY = ?, MANAGER = ? where NAME = ?""", (new_employer, salary, manager, employee)) 
                            conn.commit()
                            conn.close()

                            ch.basic_publish(
                                exchange="broker",
                                routing_key=f"data_broadcast",
                                body="",
                            )

                        self.work_queue[confirmation_code] = confirm
                        ch.basic_publish(
                            exchange="broker",
                            routing_key=routing_key,
                            body=json.dumps(
                                {
                                    "sender": "admin",
                                    "message": f"Do you want to hire {employee} at {new_employer} for a salary of {locale.currency(salary, grouping=True)}? Send me back the word 'confirm' or 'deny' and this confirmation code: {confirmation_code}",
                                }
                            ),
                        )
           

        def thread_function():
            connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
            channel = connection.channel()
            channel.queue_declare("admin", exclusive=True)

            channel.queue_bind(
                exchange="broker", queue="admin", routing_key="admin.#"
            )

            channel.basic_consume(
                queue="admin", on_message_callback=callback, auto_ack=True
            )

            channel.start_consuming()

        self.thread = threading.Thread(target=thread_function)
