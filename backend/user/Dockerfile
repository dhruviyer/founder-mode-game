FROM python:3.12-slim-bookworm

WORKDIR /user

RUN pip install websockets pika psycopg2-binary

EXPOSE 8080

COPY user.py ./

CMD ["python", "-u", "user.py"]