FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY playbooks/Playbook_00/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY contract ./contract
COPY playbooks/Playbook_00 .

CMD ["python", "main.py"]
