-- CreateTable
CREATE TABLE "tax_parcels" (
    "id" SERIAL NOT NULL,
    "parcel_no" VARCHAR(50) NOT NULL,
    "owner_name" VARCHAR(100),
    "valuation" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tax_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cbms_indicators" (
    "id" SERIAL NOT NULL,
    "indicator_code" VARCHAR(20) NOT NULL,
    "indicator_value" DECIMAL(10,2),
    "status" VARCHAR(20),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cbms_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(20),
    "lgu_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50),
    "last_login" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "actor_id" INTEGER,
    "action" VARCHAR(100),
    "details" TEXT,
    "lgu_id" INTEGER,
    "actor" TEXT,
    "created_by" TEXT,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_muni_master" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "city_muni_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_layers" (
    "id" SERIAL NOT NULL,
    "lgu_id" INTEGER,
    "category_id" INTEGER,
    "layer_name" VARCHAR(100) NOT NULL,
    "geom" geometry,
    "metadata" JSONB,
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "map_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "lgu_id" INTEGER,
    "category_id" INTEGER,
    "project_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_status" (
    "id" SERIAL NOT NULL,
    "server_name" VARCHAR(50) DEFAULT 'Main-Server',
    "last_reboot" TIMESTAMPTZ(6) DEFAULT (CURRENT_TIMESTAMP - '156:00:00'::interval),
    "is_online" BOOLEAN DEFAULT true,
    "last_heartbeat" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_parcels_parcel_no_key" ON "tax_parcels"("parcel_no");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "city_muni_master_name_key" ON "city_muni_master"("name");

-- CreateIndex
CREATE INDEX "idx_map_layers_geom" ON "map_layers" USING GIST ("geom");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lgu_id_fkey" FOREIGN KEY ("lgu_id") REFERENCES "city_muni_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_lgu_id_fkey" FOREIGN KEY ("lgu_id") REFERENCES "city_muni_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "map_layers" ADD CONSTRAINT "map_layers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "map_layers" ADD CONSTRAINT "map_layers_lgu_id_fkey" FOREIGN KEY ("lgu_id") REFERENCES "city_muni_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "map_layers" ADD CONSTRAINT "map_layers_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "project_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_lgu_id_fkey" FOREIGN KEY ("lgu_id") REFERENCES "city_muni_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
