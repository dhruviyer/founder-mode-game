FROM python:3.12-slim-bookworm

WORKDIR /multiplexed-dev

RUN pip install pika openai psycopg2-binary Faker

COPY multiplexed_dev.py ./

ENV NUM_AGENTS 3

CMD "python" "-u" "multiplexed_dev.py" ${NUM_AGENTS}