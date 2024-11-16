import { Request, Response } from 'express';
import prisma from '../prisma';
import { UserInput } from '../types/userTypes';

export const createUser = async (req: Request, res: Response) => {
    const { email, designation, departmentId }: UserInput = req.body;

    try {
        const user = await prisma.user.create({
            data: {
                email,
                designation,
                departmentId,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve user" });
    }
}
