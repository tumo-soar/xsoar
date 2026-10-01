FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY Playbook_01/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY contract ./contract
COPY Playbook_01 .

EXPOSE 8000
CMD ["python", "main.py"]
