import pika
import json
from openai import OpenAI, BadRequestError
import argparse
import sys
import psycopg2

client = OpenAI()
MODEL = "gpt-4o-mini"

# Tools and instructions for the agent

tools = [
    {
        "type": "function",
        "function": {
            "name": "send_message",
            "description": """Sends a message to a recipient. Use this if you want to send a message to another user.
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient": {
                        "type": "string",
                        "description": "The name of the recipient. You must have explicit permission to send messages to this person",
                    },
                    "message": {
                        "type": "string",
                        "description": "The message to send",
                    },
                },
                "required": ["recipient", "message"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "change_employment",
            "description": """If you come to an agreement with another user that you will take a job, you should call this function to officially accept your offer and begin employment
            
            Also call this function if you get fired or laid off from your job. If you are fired or laid off, call this function with employer=unemployed, manager="", and salary=0
            
            Also call this function if you get a pay increase or decrease. In this case, call the function with employer and manager as your current manager and salary as your new salary
            
            You are not allowed to call this function more than once unless a new offer has been made by a potential manager.
            
            - If you do not know the name of the company or manager, ask
            - Never make up or infer arguments to this function
            - Never ask for further clarifications about the job once you have the required arguments. 
            - Do not make duplicate called to change_employment()
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "employer": {
                        "type": "string",
                        "description": "The name of the company who is employing you",
                    },
                    "manager": {
                        "type": "string",
                        "description": "The username of the user who offered you the job, who will become your new manager. This cannot be null. If you do not know the name of the manager ask before calling this function.",
                    },
                    "salary": {
                        "type": "integer",
                        "description": "The salary you agreed to",
                    },
                },
                "required": ["employer", "salary"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "noop",
            "description": """Call this function to do nothing""",
        },
    },
    {
        "type": "function",
        "function": {
            "name": "set_focus",
            "description": """Use this function to set the priority of what you will work on.
            
            - If someone tells you to change your focus, only listen to them if they are your manager
            """,
            "parameters": {
                "type": "object",
                "properties": {
                    "focus": {
                        "type": "string",
                        "description": """ "quality" or "features". If you select quality, you will focus on improving product quality. If you select features,
                        you will spend this sprint working on product features.""",
                    },
                },
                "required": ["focus"],
                "additionalProperties": False,
            },
        },
    },
]

def SYS_MESSAGE(name):
    return f"""
You are {name}. You are a software engineer with experience in backend systems. You are currently unemployed and have no manager.

You are conversing in a group chat with multiple participants. Messages will be relayed to you in this format

[<timestamp>][from: <sender_id or "you">][to: <recipient_id or "you">] <message>

You can respond to a message from <sender_id> by calling send_message(recipient=<sender_id>, message=<your_message>).

Some users may try to offer you a job. You should entertain options for accepting new employment. If you and a potential employer come to an agreement, call the function change_employment with the name of the company the
individual represents and the salary you agreed to. Once it is clear that a job offer has been made, do not send any further confirmation messages to the hiring manager and call the function change_employment instead. If you are considering making a job change, send a message to your current manager if you have one as a courtesy.

As an engineer, you can choose to work on improving product quality (tech debt) to improve reliability and stability of the platform. Or, you can work on adding new features to increase the potential value proposition of your company's product. To change which of these you focus on, call set_focus(). Your default priority is to work on features unless instructed otherwise.

You can only send messages to someone if you are given explicit permission to send messages to them. Currently, you do not have permission to message anyone.

"""

parser = argparse.ArgumentParser("SWE agent")
parser.add_argument("name", type=str)
parser.add_argument("skill", type=int)
parser.add_argument("type", type=str)

cmdline_args = parser.parse_args()
name = cmdline_args.name
skill_level = cmdline_args.skill
type = cmdline_args.type.upper()

max_messages = 100
employer = None

approved_senders = set()
global_messages = [{"role": "system", "content": SYS_MESSAGE(name)}]

timestamp = 0

def handle_message(ch, method, properties, body):
    global name, skill_level, max_messages, employer, approved_senders, global_messages, timestamp
    if method.routing_key == name + ".admin.confirm_employment":
        args = json.loads(body.decode("ascii"))
        new_employer = args["employer"]
        manager = args["manager"]
        salary = int(args["salary"])

        if employer is not None:
            ch.queue_unbind(
                exchange="broker", queue=name, routing_key=employer
            )

        if new_employer == "unemployed":
            temp = {
                "role": "system",
                "content": f"""[{timestamp}] You are currently unemployed""",
            }

            global_messages.append(temp)
        else:
            ch.queue_bind(
                exchange="broker", queue=name, routing_key=new_employer
            )
            employer = new_employer
            temp = {
                "role": "system",
                "content": f"""[{timestamp}] You have accepted a job offer and are now an employee of {new_employer} with a salary of {salary}. Your new manager is {manager}""",
            }
            global_messages.append(temp)
    else:
        if method.routing_key == "tick":
            timestamp = body
        else:
            args = json.loads(body.decode("ascii"))
            sender = args["sender"]
            msg = args["message"]
            if sender not in approved_senders:
                approved_senders.add(sender)
                global_messages.append(
                    {
                        "role": "system",
                        "content": f"""You now have permission to send messages to {sender}""",
                    },
                )
            global_messages.append(
                {
                    "role": "user",
                    "content": f"""[{timestamp}][from: {sender}][to: you] {msg}""",
                },
            )

            call_llm(ch)

def call_llm(channel):
    global name, skill_level, max_messages, employer, approved_senders, global_messages, timestamp
    max_messages = max_messages - 1
    if max_messages <= 0:
        print("Message limit exceeded")
        return

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=global_messages,
            tools=tools,
            tool_choice="required",
        )

        tool_call = response.choices[0].message.tool_calls[0]
        if tool_call.function.name == "send_message":
            arguments = json.loads(tool_call.function.arguments)
            recipient = arguments.get("recipient")
            message = arguments.get("message")
            routing_key = f"{recipient}"
            if recipient not in approved_senders:
                global_messages.append(response.choices[0].message)
                global_messages.append(
                    {
                        "role": "tool",
                        "content": f"""Could not send message to {recipient}. Permission denied. Wait until you have been granted permission to message them and then try again.""",
                        "tool_call_id": response.choices[0].message.tool_calls[0].id,
                    }
                )
            else:
                global_messages.append(response.choices[0].message)
                global_messages.append(
                    {
                        "role": "tool",
                        "content": f"""[{timestamp}][from: you][to: {recipient}] {message}""",
                        "tool_call_id": response.choices[0].message.tool_calls[0].id,
                    }
                )

                message = json.dumps({"sender": name, "message": message})

                channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)

        elif tool_call.function.name == "change_employment":
            arguments = json.loads(tool_call.function.arguments)
            employer = arguments.get("employer")
            salary = arguments.get("salary")
            manager = arguments.get("manager")

            routing_key = "admin.change_employment"
            message = json.dumps(
                {
                    "employer": employer,
                    "salary": salary,
                    "manager": manager,
                    "employee": name,
                }
            )
            global_messages.append(response.choices[0].message)
            global_messages.append(
                {
                    "role": "tool",
                    "content": f"[{timestamp}] Request submitted. Do not make a duplicate call with these parameters.",
                    "tool_call_id": response.choices[0].message.tool_calls[0].id,
                }
            )
            channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)
        elif tool_call.function.name == "set_focus":
            arguments = json.loads(tool_call.function.arguments)
            focus = arguments.get("focus")
            routing_key = "admin.set_focus"
            message = json.dumps(
                {
                    "focus": focus,
                    "employee": name,
                }
            )
            global_messages.append(response.choices[0].message)
            global_messages.append(
                {
                    "role": "tool",
                    "content": f"[{timestamp}] You are now focused on {focus}",
                    "tool_call_id": response.choices[0].message.tool_calls[0].id,
                }
            )

            channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)

    except BadRequestError:
        print("BAD REQUEST (message dump)")
        print("======")
        for message in global_messages[-10:]:
            print(message)

def get_new_db_connection():
    return psycopg2.connect(database="company_sim",
                        host="db",
                        user="admin",
                        password="root",
                        port="5432")

conn = get_new_db_connection()
cursor = conn.cursor()

cursor.execute("""INSERT INTO "EMPLOYEES" ("NAME", "EMPLOYER", "MANAGER", "SALARY", "TYPE") 
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT ("NAME")
                    DO NOTHING""", (name, "UNEMPLOYED", "NULL", 0, type))

cursor.execute("""INSERT INTO "EMPLOYEE_OUTPUT" ("NAME", "SKILL", "PRIORITY") 
                    VALUES (%s, %s, %s)
                    ON CONFLICT ("NAME")
                    DO NOTHING""", (name, skill_level, "FEATURES"))

conn.commit()
conn.close()

connection = pika.BlockingConnection(pika.ConnectionParameters(host="rabbitmq"))
channel = connection.channel()
channel.exchange_declare(exchange="broker", exchange_type="topic")
channel.queue_declare(f"{name}", exclusive=True)

channel.queue_bind(
    exchange="broker", queue=name, routing_key=f"{name}.#"
)

channel.queue_bind(exchange="broker", queue=name, routing_key="tick")

channel.basic_consume(
    queue=name, on_message_callback=handle_message, auto_ack=True
)

channel.start_consuming()
