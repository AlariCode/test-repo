import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const user = {
	email: 'a@a.ru',
	password: 'sdfs'
}

const posts = [
	{
		title: 'Новый пост',
		content: 'Новый контент',
	}
]

async function main() {
	await prisma.$connect();
	const createdUser = await prisma.user.create({ data: user });
	await prisma.post.createMany({
		data: posts.map(p => ({ ...p, authorId: createdUser.id }))
	});
	await prisma.$disconnect();
}

main();