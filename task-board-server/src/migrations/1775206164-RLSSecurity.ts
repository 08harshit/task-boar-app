import { MigrationInterface, QueryRunner } from "typeorm";

export class RLSSecurity1775206164 implements MigrationInterface {
    name = 'RLSSecurity1775206164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Enable RLS on all tables
        await queryRunner.query(`ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "boards" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "columns" ENABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;`);

        // 2. Project Policies
        await queryRunner.query(`
            CREATE POLICY "Users can see projects they are members of" ON "projects"
            FOR SELECT USING (
                auth.uid() = owner_id OR 
                EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
            );
        `);

        // 3. ProjectMember Policies
        await queryRunner.query(`
            CREATE POLICY "Users can see members of their projects" ON "project_members"
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
            );
        `);

        // 4. Board Policies
        await queryRunner.query(`
            CREATE POLICY "Users can see boards in their projects" ON "boards"
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = boards.project_id AND pm.user_id = auth.uid())
            );
        `);

        // 5. Column & Task Policies (Cascading access)
        await queryRunner.query(`
            CREATE POLICY "Users can see columns in their projects" ON "columns"
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM boards b 
                    JOIN project_members pm ON pm.project_id = b.project_id 
                    WHERE b.id = columns.board_id AND pm.user_id = auth.uid()
                )
            );
        `);

        await queryRunner.query(`
            CREATE POLICY "Users can see tasks in their projects" ON "tasks"
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM columns c
                    JOIN boards b ON b.id = c.board_id
                    JOIN project_members pm ON pm.project_id = b.project_id 
                    WHERE c.id = tasks.column_id AND pm.user_id = auth.uid()
                )
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS "Users can see projects they are members of" ON "projects"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "Users can see members of their projects" ON "project_members"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "Users can see boards in their projects" ON "boards"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "Users can see columns in their projects" ON "columns"`);
        await queryRunner.query(`DROP POLICY IF EXISTS "Users can see tasks in their projects" ON "tasks"`);

        await queryRunner.query(`ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "columns" DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "boards" DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "project_members" DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;`);
    }

}
