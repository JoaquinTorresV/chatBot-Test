import dotenv from 'dotenv';
import {GoogleGenerativeAI} from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function chat(prompt:string, text:string) {
    const model = genAI.getGenerativeModel({model:"gemini-2.0-flash"});
    
    const formatPrompt = "Eres un asistente virtual. Al final te voy a dar un input que envio el usuario." +prompt+ "el imput del usaurio es el siguiente" +text;

    const result = await model.generateContent(formatPrompt)
    const response = result.response;
    const answ = response.text();
    return answ
}           