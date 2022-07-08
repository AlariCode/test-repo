import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

class App {
	init() {
		await prisma.$connect();
		await prisma.post.findFirst({ where: { title: 'sdfs' }});
		await prisma.user.findUnique({ where: { id: 1 } });
		await prisma.user.findMany({ where: { id: { gte: 1 } } });
		await prisma.post.findMany(
			{ where: 
				{ tags: 
					{ some: 
						{ tag: 
							{ name: 'Мой тег' } 
						} 
					} 
				} 
			}
		);

		await prisma.post.create({
			data: {
				title: 'Новый пост',
				content: 'Новый контент'
			}		
		});
		await prisma.post.update({
			where: {
				id: 1,
			},
			data: {
				title: 'Новый пост',
			}
		});
		await prisma.post.delete({
			where: {
				id: 1,
			}
		});
		await prisma.$queryRaw('SELECT * FROM "posts"');
	}
}

const app = new App();
app.init();