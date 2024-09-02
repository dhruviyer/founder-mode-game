FROM python:3.12-slim-bookworm

WORKDIR /dev-agent

RUN pip install pika openai psycopg2-binary

COPY dev_agent.py ./

ENV NAME "Anon"
ENV SKILL 0
ENV TYPE "ENGINEER"

CMD "python" "-u" "dev_agent.py" ${NAME} ${SKILL} ${TYPE}