import pika
import json
import asyncio
import websockets
import threading
import functools
import re
import sqlite3

connections = {}
def sync(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.get_event_loop().run_until_complete(f(*args, **kwargs))
    return wrapper

@sync
async def callback(ch, method, properties, body):
    print(f"[{method.routing_key}] {body}")
    ignored_routing_keys = [
        r'^admin.change_employment$',
        r'^admin.confirm$',
        r'^admin.set_focus$',
        r'^[a-zA-Z0-9]+\.admin.confirm_employment$'
    ]

    try:
        if method.routing_key == "data_broadcast":
            conn = sqlite3.connect('company_sim.db') 
            cursor = conn.cursor() 

            employee_data = cursor.execute('''SELECT * FROM EMPLOYEES''')
            employee_data = [{"name":row[0], "employer": row[1], "manager": row[2], "salary": row[3], "type": row[4]} for row in employee_data]
            conn.close()

            for recipient in connections:
                data_packet = {
                    "type": "data",
                    "employees": employee_data,
                }
                if "company" in connections[recipient]:
                    output_data = cursor.execute("""SELECT EMPLOYEES.NAME, EMPLOYER, PRIORITY FROM 
                                                EMPLOYEE_OUTPUTS
                                                INNER JOIN ON EMPLOYEES.NAME=EMPLOYEE_OUTPUTS.NAME
                                                WHERE EMPLOYER=?""",(connections[recipient]["company"]))
                    output_data = [{"name":row[0], "priority": row[1], "employer": row[2]} for row in output_data]
                    data_packet["outputs"] = output_data

                await connections[recipient]["socket"].send(json.dumps(data_packet))
                return

        for pattern in ignored_routing_keys:
            if re.match(pattern, method.routing_key):
                print("matched", pattern)
                return
            
        args = json.loads(body.decode("ascii"))
        sender = args["sender"]
        message = args["message"]
        recipient = method.routing_key
        if recipient in connections:
            socket = connections[recipient]["socket"]
            await socket.send(json.dumps({"type": "message", "sender": sender, "message": message}))
    except json.decoder.JSONDecodeError:
        pass

def validate_message(message):
    msg = message.split(" ", 1)
    if len(msg) != 2:
        return False
    else:
        routing_key = msg[0].lower()
        message = msg[1]
        if not routing_key.startswith("/"):
            return False
        return True

async def send_data(websocket, path):
    global connections
    try:
        async for message in websocket:
            args = json.loads(message)
            sender = args["sender"]
            if sender not in connections:
                connections[sender] = {"socket":websocket}

                conn = sqlite3.connect('company_sim.db') 
                cursor = conn.cursor() 

                employee_data = cursor.execute('''SELECT * FROM EMPLOYEES''')
                employee_data = [{"name":row[0], "employer": row[1], "manager": row[2], "salary": row[3], "type": row[4]} for row in employee_data]
                conn.close()

                data_packet = {
                    "type": "data",
                    "employees": employee_data,
                }

                await connections[sender]["socket"].send(json.dumps(data_packet))
            
            if args["message"] == 'heartbeat':
                return
            elif args["message"].startswith("registration"):
                temp = args["message"].split(" ")
                username = temp[1]
                company = temp[2]
                connections[username]["company"] = company
                return
            
            elif not validate_message(args["message"]):
                return
            
            msg = args["message"].split(" ", 1)
            routing_key = msg[0].lower()
            message = msg[1]
            if routing_key.startswith("/"):
                routing_key = routing_key[1:]
            
            message = json.dumps({"sender": sender, "message": message})

            connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
            channel = connection.channel()
            channel.exchange_declare(exchange="broker", exchange_type="topic")

            channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)

            connection.close()

            await websocket.send(json.dumps({"type": "message", "sender": f"You (to {routing_key})", "message": msg[1]}))
    finally:
        connections = {key: value for key, value in connections.items() if value["socket"] != websocket}

def publisher():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
    channel = connection.channel()

    result = channel.queue_declare("", exclusive=True)
    queue_name = result.method.queue

    channel.queue_bind(exchange="broker", queue=queue_name, routing_key="#")
    channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)

    channel.start_consuming()

publisher_thread = threading.Thread(target=publisher)
publisher_thread.start()

start_server = websockets.serve(send_data, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

publisher_thread.join()
