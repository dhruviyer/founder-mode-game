FROM python:3.12-slim-bookworm

WORKDIR /admin

RUN pip install pika

COPY admin.py ./

CMD ["python", "admin.py"]