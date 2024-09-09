import pika
import json
import asyncio
import websockets
import psycopg2
import threading
import functools
import re

connections = {}

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

def get_new_db_connection():
    return psycopg2.connect(database="company_sim",
                        host="db",
                        user="admin",
                        password="root",
                        port="5432")

def db_retrieve(operation, parameters=None):
    conn = get_new_db_connection()
    cursor = conn.cursor() 
    cursor.execute(operation, parameters)
    data = cursor.fetchall()
    conn.close()
    return data

def sync(f):
    global connections
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.get_event_loop().run_until_complete(f(*args, **kwargs))
    return wrapper

@sync
async def handle_message(ch, method, properties, body):
    await handle_message_inner(method.routing_key, body)

async def handle_message_inner(routing_key, body):
    global connections
    print(f"[{routing_key}] {body}")
    ignored_routing_keys = [
        r'^admin.change_employment$',
        r'^admin.confirm$',
        r'^admin.set_focus$',
        r'^[a-zA-Z0-9]+\.admin.confirm_employment$',
        r'admin.invest',
        r'^[a-zA-Z0-9_]+\.admin\.confirm_investment$'
    ]

    try:
        if routing_key == "tick":
            for recipient in connections.keys():
                if "company" in connections[recipient] and "socket" in connections[recipient]:
                    company_data = db_retrieve("""SELECT * FROM "COMPANIES" 
                                                        WHERE "NAME"=%s""",(connections[recipient]["company"],))
                    company_data = [{"timestamp": body.decode("ascii"), "name":row[0], "cash": row[1], "features": row[2], "valuation": row[3], "arr": row[4], "quality": row[5]} for row in company_data]
                    data_packet = {
                            "type": "data",
                            "company": company_data,
                        }    
                    try:
                        await connections[recipient]["socket"].send(json.dumps(data_packet))
                    except websockets.ConnectionClosedOK: pass

        elif routing_key == "data_broadcast":
            employee_data = db_retrieve('''SELECT "EMPLOYEES"."NAME", "EMPLOYER", "SALARY", "TYPE", "SKILL" FROM "EMPLOYEES"
                                        LEFT JOIN "EMPLOYEE_OUTPUT" ON "EMPLOYEES"."NAME" = "EMPLOYEE_OUTPUT"."NAME"''')
            employee_data = [{"name":row[0], "employer": row[1], "salary": row[2], "type": row[3], "skill": row[4]} for row in employee_data]
            
            for recipient in connections.keys():
                print(connections[recipient])
                data_packet = {
                    "type": "data",
                    "employees": employee_data,
                }
                if "company" in connections[recipient]:
                    output_data = db_retrieve("""SELECT "EMPLOYEES"."NAME", "EMPLOYER", "PRIORITY", "SKILL", "SALARY"
                                                FROM "EMPLOYEE_OUTPUT"
                                                INNER JOIN "EMPLOYEES" ON "EMPLOYEES"."NAME"="EMPLOYEE_OUTPUT"."NAME"
                                                WHERE "EMPLOYER"=%s""",(connections[recipient]["company"],))
                    output_data = [{"name":row[0], "employer": row[1], "priority": row[2], "skill": row[3],"salary": row[4]} for row in output_data]
                    data_packet["outputs"] = output_data

                    company_data = db_retrieve("""SELECT * FROM "COMPANIES"
                                                  WHERE "NAME"=%s""",(connections[recipient]["company"],))
                    company_data = [{"name":row[0], "cash": row[1], "features": row[2], "valuation": row[3], "arr": row[4], "quality": row[5]} for row in company_data]
                    data_packet["company"] = company_data
                try:
                    await connections[recipient]["socket"].send(json.dumps(data_packet))
                except websockets.ConnectionClosedOK: pass
        else:
            for pattern in ignored_routing_keys:
                if re.match(pattern, routing_key):
                    print("matched", pattern)
                    return
            
    
            args = json.loads(body.decode("ascii"))
            print(args)
            sender = args["sender"]
            message = args["message"]
            recipient = routing_key
            if recipient.startswith("company"):
                company = recipient.split(".")[1]
                for recipient in connections.keys():
                    if "company" in connections[recipient] and "socket" in connections[recipient] and connections[recipient]["company"] == company:
                        socket = connections[recipient]["socket"]
                        try:
                            await socket.send(json.dumps({"type": "message", "sender": sender, "message": message}))
                        except websockets.ConnectionClosedOK: pass

            elif recipient in connections:
                socket = connections[recipient]["socket"]
                try:
                    await socket.send(json.dumps({"type": "message", "sender": sender, "message": message}))
                except websockets.ConnectionClosedOK: pass

    except json.decoder.JSONDecodeError:
        pass

async def handle_user_input(websocket, path):
    global connections
    try:
        async for message in websocket:
            args = json.loads(message)
            sender = args["sender"]
            if sender not in connections: 
                connections[sender] = {}

            if "socket" not in connections[sender]:
                connections[sender] = {"socket":websocket}

                employee_data = db_retrieve('''SELECT * FROM "EMPLOYEES"''')
                employee_data = [{"name":row[0], "employer": row[1], "manager": row[2], "salary": row[3], "type": row[4]} for row in employee_data]

                data_packet = {
                    "type": "data",
                    "employees": employee_data,
                }

                print(connections)
                await connections[sender]["socket"].send(json.dumps(data_packet))
            
            if args["message"] == 'heartbeat':
                pass
            elif args["message"].startswith("register"):
                temp = args["message"].split(" ")
                print(sender)
                username = temp[1]
                company = temp[2]

                connections[username]["company"] = company
                connections[username]["socket"] = websocket

                conn = get_new_db_connection()
                cursor = conn.cursor() 

                print(username, company)

                cursor.execute( 
                    """INSERT INTO "COMPANIES" ("NAME", "CASH", "FEATURES", "VALUATION", "ARR") 
                    VALUES (%s, 0, 0, 0, 0)
                     ON CONFLICT ("NAME")
                     DO UPDATE SET "CASH"=0, "FEATURES"=0, "VALUATION"=0, "ARR"=0""", (company,)) 
                
                conn.commit()

                company_data = [{"name":company, "cash": 0, "features": 0, "valuation": 0, "arr": 0}]
                conn.close()

                data_packet = {
                    "type": "data",
                    "company": company_data,
                }
                
                await connections[username]["socket"].send(json.dumps(data_packet))

                await handle_message_inner("data_broadcast", None)
            
            elif validate_message(args["message"]):
                msg = args["message"].split(" ", 1)
                routing_key = msg[0].lower()
                message = msg[1]
                if routing_key.startswith("/"):
                    routing_key = routing_key[1:]
                
                message = json.dumps({"sender": sender, "message": message})
                await websocket.send(json.dumps({"type": "message", "sender": f"You (to {routing_key})", "message": msg[1]}))
                
                connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq"))
                channel = connection.channel()
                channel.exchange_declare(exchange="broker", exchange_type="topic")

                channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)

                connection.close()

                
    finally:
        connections = {key: value for key, value in connections.items() if "socket" not in value or ("socket" in value and value["socket"] != websocket)}

def listener():
    global connections
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq"))
    channel = connection.channel()

    result = channel.queue_declare("", exclusive=True)
    queue_name = result.method.queue
    channel.exchange_declare(exchange="broker", exchange_type="topic")

    channel.queue_bind(exchange="broker", queue=queue_name, routing_key="#")
    channel.basic_consume(queue=queue_name, on_message_callback=handle_message, auto_ack=True)

    channel.start_consuming()

event_thread = threading.Thread(target=listener)
event_thread.start()

start_server = websockets.serve(handle_user_input, "0.0.0.0", 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

event_thread.join()
