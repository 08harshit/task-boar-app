import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectHierarchy1775205901 implements MigrationInterface {
    name = 'ProjectHierarchy1775205901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create projects table
        await queryRunner.query(`CREATE TABLE "projects" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "name" character varying NOT NULL, 
            "description" text, 
            "owner_id" uuid NOT NULL, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_projects" PRIMARY KEY ("id")
        )`);

        // Create project_members table
        await queryRunner.query(`CREATE TABLE "project_members" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "project_id" uuid NOT NULL, 
            "user_id" uuid NOT NULL, 
            "role" character varying NOT NULL DEFAULT 'member', 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_project_members" PRIMARY KEY ("id")
        )`);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "FK_project_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE`);

        // Link boards to projects
        await queryRunner.query(`ALTER TABLE "boards" ADD "project_id" uuid`);
        await queryRunner.query(`ALTER TABLE "boards" ADD CONSTRAINT "FK_boards_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "boards" DROP CONSTRAINT "FK_boards_project"`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "project_id"`);
        await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT "FK_project_members_project"`);
        await queryRunner.query(`DROP TABLE "project_members"`);
        await queryRunner.query(`DROP TABLE "projects"`);
    }

}
