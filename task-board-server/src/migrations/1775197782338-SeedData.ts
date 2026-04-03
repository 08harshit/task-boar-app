import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedData1775197782338 implements MigrationInterface {
    name = 'SeedData1775197782338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_column"`);
        await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_columns_board"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "columns" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "columns" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "columns" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "columns" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_986f14173dba32448f3f3abb1c4" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "columns" ADD CONSTRAINT "FK_3f88407849daf390e93035b15ef" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Seed Sample Data
        await queryRunner.query(`
            INSERT INTO "boards" (id, name) VALUES (uuid_generate_v4(), 'Main Task Board');
        `);

        await queryRunner.query(`
            INSERT INTO "columns" (id, board_id, name, "order")
            SELECT uuid_generate_v4(), id, 'To Do', 0 FROM "boards" WHERE name = 'Main Task Board';
        `);

        await queryRunner.query(`
            INSERT INTO "columns" (id, board_id, name, "order")
            SELECT uuid_generate_v4(), id, 'In Progress', 1 FROM "boards" WHERE name = 'Main Task Board';
        `);

        await queryRunner.query(`
            INSERT INTO "columns" (id, board_id, name, "order")
            SELECT uuid_generate_v4(), id, 'Done', 2 FROM "boards" WHERE name = 'Main Task Board';
        `);

        await queryRunner.query(`
            INSERT INTO "tasks" (id, column_id, title, details, "order")
            SELECT uuid_generate_v4(), id, 'Setup Project', 'Initial scaffolding and tools setup', 0 
            FROM "columns" WHERE name = 'Done';
        `);

        await queryRunner.query(`
            INSERT INTO "tasks" (id, column_id, title, details, "order")
            SELECT uuid_generate_v4(), id, 'Implement Tasks API', 'Create service and controllers', 1 
            FROM "columns" WHERE name = 'In Progress';
        `);
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_3f88407849daf390e93035b15ef"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_986f14173dba32448f3f3abb1c4"`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "columns" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "columns" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "columns" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "columns" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "columns" ADD CONSTRAINT "FK_columns_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_column" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
