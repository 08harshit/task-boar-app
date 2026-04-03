import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774716360507 implements MigrationInterface {
    name = 'InitialSchema1774716360507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension (Supabase usually has this, but safe to check)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`CREATE TABLE "boards" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "name" character varying NOT NULL, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_boards" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "columns" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "board_id" uuid NOT NULL, 
            "name" character varying NOT NULL, 
            "order" integer NOT NULL DEFAULT 0, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_columns" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "tasks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "column_id" uuid NOT NULL, 
            "title" character varying NOT NULL, 
            "details" text, 
            "order" integer NOT NULL DEFAULT 0, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`ALTER TABLE "columns" ADD CONSTRAINT "FK_columns_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_column" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_column"`);
        await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_columns_board"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TABLE "columns"`);
        await queryRunner.query(`DROP TABLE "boards"`);
    }

}
