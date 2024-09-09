FROM python:3.12-slim-bookworm

WORKDIR /multiplexed-vc

RUN pip install pika openai psycopg2-binary Faker

COPY multiplexed_vc.py ./

ENV NUM_AGENTS 1

CMD "python" "-u" "multiplexed_vc.py" ${NUM_AGENTS}