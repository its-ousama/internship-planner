import pool from "./db";
import dotenv from "dotenv";
dotenv.config();

const topics = [
  {
    slug: "grafana", name: "Grafana", abbr: "Data Visualization & Dashboard Platform",
    icon: "📊", color: "#d97706", category: "Monitoring Stack",
    description: "Grafana is an open-source platform for visualizing and analyzing metrics, logs, and traces. At SNCF, it's the main window into system health — you build dashboards that pull data from sources like Prometheus or Loki and display it as graphs, tables, and alerts.",
    analogy: "Think of Grafana as the cockpit of a train — it doesn't run the engine, but it shows you every dial and warning light you need to make decisions.",
    concepts: [
      { term: "Dashboard", def: "A collection of panels arranged on a grid, each showing a specific metric or visualization." },
      { term: "Panel", def: "A single visualization unit — can be a graph, stat, table, gauge, or heatmap." },
      { term: "Data Source", def: "The backend Grafana queries — Prometheus, Loki, PostgreSQL, etc." },
      { term: "Query", def: "A request sent to a data source to retrieve specific metrics or logs." },
      { term: "Alert", def: "A rule that triggers a notification when a metric crosses a threshold." },
      { term: "Variable", def: "A dynamic dropdown that filters dashboard data (e.g. by environment or service)." }
    ],
    connects: [{ id: "prometheus", why: "Primary metrics data source" }, { id: "loki", why: "Log visualization" }]
  },
  {
    slug: "prometheus", name: "Prometheus", abbr: "Metrics Collection & Alerting System",
    icon: "🔥", color: "#dc2626", category: "Monitoring Stack",
    description: "Prometheus is a time-series database and monitoring system that scrapes metrics from your services at regular intervals. It stores numeric data over time — things like CPU usage, request counts, error rates — and lets you query them with its language PromQL.",
    analogy: "Prometheus is like a health tracker that takes your pulse every 15 seconds and stores every reading. Grafana is the app that draws the chart.",
    concepts: [
      { term: "Metric", def: "A numeric measurement tracked over time — e.g. http_requests_total." },
      { term: "Scrape", def: "Prometheus pulling metrics from a target endpoint (usually /metrics) on a schedule." },
      { term: "PromQL", def: "Prometheus Query Language — used to filter, aggregate, and calculate metrics." },
      { term: "Label", def: "Key-value pairs attached to metrics to add context (e.g. env='prod', service='api')." },
      { term: "Exporter", def: "A small service that exposes metrics in Prometheus format (e.g. node_exporter for system stats)." },
      { term: "AlertManager", def: "Companion service that handles alert routing, grouping, and notification." }
    ],
    connects: [{ id: "grafana", why: "Visualized in dashboards" }, { id: "kubernetes", why: "Scrapes pod/node metrics" }]
  },
  {
    slug: "loki", name: "Loki", abbr: "Log Aggregation System",
    icon: "📋", color: "#7c3aed", category: "Monitoring Stack",
    description: "Loki is a log aggregation system built by Grafana Labs, designed to be cost-efficient by only indexing metadata (labels) rather than full log content. It pairs directly with Grafana for log visualization and uses LogQL as its query language.",
    analogy: "If Prometheus tracks numbers over time, Loki tracks text over time — the actual log lines your services print when something happens.",
    concepts: [
      { term: "Log Stream", def: "A sequence of log entries sharing the same set of labels." },
      { term: "Label", def: "Key-value metadata used to identify and filter log streams (e.g. app='api')." },
      { term: "LogQL", def: "Loki's query language — filter logs by label, search text, and compute metrics from logs." },
      { term: "Chunk", def: "A compressed block of log data stored together for efficiency." },
      { term: "Promtail", def: "The agent that ships logs from your servers/containers into Loki." }
    ],
    connects: [{ id: "grafana", why: "Log visualization in dashboards" }, { id: "kubernetes", why: "Collects container logs" }]
  },
  {
    slug: "kafka", name: "Kafka", abbr: "Distributed Event Streaming Platform",
    icon: "⚡", color: "#059669", category: "Data & Messaging",
    description: "Apache Kafka is a distributed event streaming platform used to build real-time data pipelines. At SNCF, it acts as the backbone for passing events between services — things like train position updates, ticket validations, or sensor readings — reliably and at high throughput.",
    analogy: "Kafka is like a post office with unlimited mailboxes. Services drop off messages, other services pick them up on their own schedule — nobody waits for anyone else.",
    concepts: [
      { term: "Topic", def: "A named feed/category of messages. Producers write to topics, consumers read from them." },
      { term: "Partition", def: "A topic is split into partitions for parallelism. Each partition is an ordered log." },
      { term: "Producer", def: "A service that publishes messages to a Kafka topic." },
      { term: "Consumer", def: "A service that reads messages from a topic, tracking its position with an offset." },
      { term: "Offset", def: "A sequential ID for each message within a partition — consumers use it to track progress." },
      { term: "Consumer Group", def: "Multiple consumers working together to process a topic in parallel." },
      { term: "Broker", def: "A single Kafka server. A cluster has multiple brokers for redundancy." }
    ],
    connects: [{ id: "kubernetes", why: "Deployed and scaled on K8s" }]
  },
  {
    slug: "kubernetes", name: "Kubernetes", abbr: "Container Orchestration Platform",
    icon: "☸️", color: "#2563eb", category: "Infrastructure",
    description: "Kubernetes (K8s) automates the deployment, scaling, and management of containerized applications. Instead of manually starting containers on servers, you declare what you want running and Kubernetes makes it happen — restarting failures, scaling under load, and routing traffic.",
    analogy: "Kubernetes is like an air traffic controller — you don't tell each plane where to land manually, you set the rules and it coordinates everything automatically.",
    concepts: [
      { term: "Pod", def: "The smallest deployable unit — one or more containers that share network and storage." },
      { term: "Deployment", def: "Declares how many replicas of a pod to run and handles rolling updates." },
      { term: "Service", def: "A stable network endpoint that routes traffic to the right pods, even as they change." },
      { term: "Namespace", def: "A virtual cluster within a cluster — used to isolate environments (dev, staging, prod)." },
      { term: "ConfigMap", def: "Stores non-sensitive configuration data that pods can consume." },
      { term: "Secret", def: "Like ConfigMap but for sensitive data — passwords, tokens, keys." },
      { term: "Ingress", def: "Manages external HTTP/HTTPS access to services, typically with routing rules." },
      { term: "kubectl", def: "The command-line tool for interacting with a Kubernetes cluster." }
    ],
    connects: [{ id: "prometheus", why: "Monitored with Prometheus" }, { id: "kafka", why: "Hosts Kafka brokers" }]
  },
  {
    slug: "docker", name: "Docker", abbr: "Container Runtime & Build Tool",
    icon: "🐳", color: "#0891b2", category: "Infrastructure",
    description: "Docker packages applications and their dependencies into containers — isolated, portable units that run the same everywhere. You write a Dockerfile describing your app, build it into an image, and run it as a container on any machine or cloud.",
    analogy: "A Docker container is like a lunchbox — everything your app needs to eat is packed inside, and it tastes the same whether you open it at your desk or on a server in Paris.",
    concepts: [
      { term: "Image", def: "A read-only snapshot of a container's filesystem, built from a Dockerfile." },
      { term: "Container", def: "A running instance of an image — isolated process with its own filesystem and network." },
      { term: "Dockerfile", def: "A script of instructions that defines how to build an image." },
      { term: "Registry", def: "A storage service for Docker images — Docker Hub, or a private registry." },
      { term: "Volume", def: "Persistent storage that survives container restarts." },
      { term: "docker-compose", def: "A tool to define and run multi-container apps locally with a single YAML file." }
    ],
    connects: [{ id: "kubernetes", why: "K8s runs Docker containers" }]
  },
  {
    slug: "gitlab-ci", name: "GitLab CI", abbr: "Continuous Integration & Delivery",
    icon: "🦊", color: "#dc2626", category: "DevOps",
    description: "GitLab CI/CD automates testing, building, and deploying your code every time you push. You define a pipeline in a .gitlab-ci.yml file — stages like test, build, deploy run automatically, catching bugs before they reach production.",
    analogy: "GitLab CI is like a quality control line in a factory — every time a new part (commit) comes in, it automatically gets tested and packaged before shipping.",
    concepts: [
      { term: "Pipeline", def: "The full automated workflow triggered by a git event — made up of stages and jobs." },
      { term: "Stage", def: "A phase in the pipeline (e.g. test, build, deploy) — jobs in the same stage run in parallel." },
      { term: "Job", def: "A single unit of work in a stage — runs a script in an isolated environment." },
      { term: "Runner", def: "The agent that executes jobs — can be shared or specific to your project." },
      { term: ".gitlab-ci.yml", def: "The config file at the root of your repo that defines your entire pipeline." },
      { term: "Artifact", def: "Files produced by a job (e.g. a build output) that can be passed to later stages." }
    ],
    connects: [{ id: "docker", why: "Builds and pushes Docker images" }, { id: "kubernetes", why: "Deploys to K8s clusters" }]
  },
  {
    slug: "ansible", name: "Ansible", abbr: "IT Automation & Configuration Management",
    icon: "⚙️", color: "#dc2626", category: "DevOps",
    description: "Ansible automates repetitive IT tasks — configuring servers, deploying software, managing infrastructure — using simple YAML files called playbooks. It's agentless, meaning you don't install anything on target machines; it works over SSH.",
    analogy: "Ansible is like a recipe book for servers — you write down exactly what a server should look like, and Ansible goes and makes it so, every time, consistently.",
    concepts: [
      { term: "Playbook", def: "A YAML file defining a set of tasks to run on target machines." },
      { term: "Task", def: "A single action — install a package, copy a file, restart a service." },
      { term: "Inventory", def: "A list of hosts Ansible will manage, grouped by role or environment." },
      { term: "Role", def: "A reusable, structured bundle of tasks, templates, and variables." },
      { term: "Module", def: "A built-in function Ansible uses to perform actions (e.g. apt, copy, service)." },
      { term: "Handler", def: "A task that only runs when notified by another task — e.g. restart nginx after config change." }
    ],
    connects: [{ id: "gitlab-ci", why: "Triggered from CI pipelines" }, { id: "docker", why: "Can manage Docker containers" }]
  }
];

async function seed() {
  console.log("Seeding topics...");
  for (const t of topics) {
    await pool.query(
      `INSERT INTO topics (slug, name, abbr, icon, color, category, description, analogy, concepts, connects)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, abbr=EXCLUDED.abbr, icon=EXCLUDED.icon,
         color=EXCLUDED.color, category=EXCLUDED.category, description=EXCLUDED.description,
         analogy=EXCLUDED.analogy, concepts=EXCLUDED.concepts, connects=EXCLUDED.connects`,
      [t.slug, t.name, t.abbr, t.icon, t.color, t.category, t.description, t.analogy,
       JSON.stringify(t.concepts), JSON.stringify(t.connects)]
    );
    console.log(`  ✓ ${t.name}`);
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });