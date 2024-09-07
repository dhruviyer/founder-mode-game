FROM python:3.12-slim-bookworm

WORKDIR /multiplexed-agent

RUN pip install pika openai psycopg2-binary Faker

COPY multiplexed_agent.py ./

ENV NUM_AGENTS 3

CMD "python" "-u" "multiplexed_agent.py" ${NUM_AGENTS}