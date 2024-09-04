FROM python:3.12-slim-bookworm

WORKDIR /admin

RUN pip install pika psycopg2-binary numpy

COPY admin.py ./

CMD ["python", "-u", "admin.py"]