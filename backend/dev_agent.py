import pika
import threading
import json
from openai import OpenAI, BadRequestError

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
                        "description": "The username of the user who offered you the job, who will become your new manager",
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

class DevAgent:
    def __init__(self, name, skill_level):
        self.name = name
        self.max_messages = 100
        self.skill_level = skill_level
        self.employer = None

        self.approved_senders = set()
        self.messages = {}
        self.global_messages = [{"role": "system", "content": SYS_MESSAGE(self.name)}]

        self.timestamp = 0

        def callback(ch, method, properties, body):
            if method.routing_key == self.name + ".admin.confirm_employment":
                args = json.loads(body.decode("ascii"))
                new_employer = args["employer"]
                manager = args["manager"]
                salary = int(args["salary"])

                if self.employer is not None:
                    ch.queue_unbind(
                        exchange="broker", queue=self.name, routing_key=self.employer
                    )

                if new_employer == "unemployed":
                    temp = {
                        "role": "system",
                        "content": f"""[{self.timestamp}] You are currently unemployed""",
                    }

                    self.global_messages.append(temp)
                else:
                    ch.queue_bind(
                        exchange="broker", queue=self.name, routing_key=new_employer
                    )
                    self.employer = new_employer
                    temp = {
                        "role": "system",
                        "content": f"""[{self.timestamp}] You have accepted a job offer and are now an employee of {new_employer} with a salary of {salary}. Your new manager is {manager}""",
                    }
                    self.global_messages.append(temp)
            else:
                if method.routing_key == "tick":
                    self.timestamp = body
                else:
                    args = json.loads(body.decode("ascii"))
                    sender = args["sender"]
                    msg = args["message"]
                    if sender not in self.approved_senders:
                        self.approved_senders.add(sender)
                        self.global_messages.append(
                            {
                                "role": "system",
                                "content": f"""You now have permission to send messages to {sender}""",
                            },
                        )
                    self.global_messages.append(
                        {
                            "role": "user",
                            "content": f"""[{self.timestamp}][from: {sender}][to: you] {msg}""",
                        },
                    )

                    self.call_llm(ch)

        def thread_function():
            connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
            channel = connection.channel()
            channel.queue_declare(f"{self.name}", exclusive=True)

            channel.queue_bind(
                exchange="broker", queue=self.name, routing_key=f"{self.name}.#"
            )

            channel.queue_bind(exchange="broker", queue=self.name, routing_key="tick")

            channel.basic_consume(
                queue=self.name, on_message_callback=callback, auto_ack=True
            )
            
            channel.start_consuming()

        self.thread = threading.Thread(target=thread_function)

    def call_llm(self, channel):
        self.max_messages = self.max_messages - 1
        if self.max_messages <= 0:
            print("Message limit exceeded")
            return
    
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=self.global_messages,
                tools=tools,
                tool_choice="required",
            )
  
            tool_call = response.choices[0].message.tool_calls[0]
            if tool_call.function.name == "send_message":
                arguments = json.loads(tool_call.function.arguments)
                recipient = arguments.get("recipient")
                message = arguments.get("message")
                routing_key = f"{recipient}"
                if recipient not in self.approved_senders:
                    self.global_messages.append(response.choices[0].message)
                    self.global_messages.append(
                        {
                            "role": "tool",
                            "content": f"""Could not send message to {recipient}. Permission denied. Wait until you have been granted permission to message them and then try again.""",
                            "tool_call_id": response.choices[0].message.tool_calls[0].id,
                        }
                    )
                else:
                    self.global_messages.append(response.choices[0].message)
                    self.global_messages.append(
                        {
                            "role": "tool",
                            "content": f"""[{self.timestamp}][from: you][to: {recipient}] {message}""",
                            "tool_call_id": response.choices[0].message.tool_calls[0].id,
                        }
                    )

                    message = json.dumps({"sender": self.name, "message": message})

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
                        "employee": self.name,
                    }
                )
                self.global_messages.append(response.choices[0].message)
                self.global_messages.append(
                    {
                        "role": "tool",
                        "content": f"[{self.timestamp}] Request submitted. Do not make a duplicate call with these parameters.",
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
                        "employee": self.name,
                    }
                )
                self.global_messages.append(response.choices[0].message)
                self.global_messages.append(
                    {
                        "role": "tool",
                        "content": f"[{self.timestamp}] You are now focused on {focus}",
                        "tool_call_id": response.choices[0].message.tool_calls[0].id,
                    }
                )

                channel.basic_publish(exchange="broker", routing_key=routing_key, body=message)

        except BadRequestError:
            print("BAD REQUEST (message dump)")
            print("======")
            for message in self.global_messages[-10:]:
                print(message)