import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'

const PORT = process.env.PORT ?? 3008

import { chat } from 'scripts/gemini'


const menuFlow = addKeyword(["Menu", "menu", "menú", "Menú"])
    .addAnswer([
        "🔍 **Selecciona una de las siguientes opciones:**\n" +
"(Escribe el número correspondiente)\n\n" +
"1️⃣ **Productos disponibles**\n" +
"2️⃣ **Quiero hacer una compra**\n" +
"3️⃣ **Dudas frecuentes**\n" +
"4️⃣ **Contactar con un trabajador**\n" +
"5️⃣ **Salir**\n\n" +
"🔄 **Si deseas volver al menú principal, escribe 'Menu'.**"

    ], { capture: true }, async (ctx, ctxFn) => {
        const option = ctx.body.trim();

        switch (option) {
            case "1":
                await ctxFn.flowDynamic("🛒 **Productos disponibles**:\n\n" +
"🍎 **Manzanas**\n" +
"🍌 **Plátanos**\n" +
"🥕 **Zanahorias**\n" +
"🥔 **Papas**\n\n" +
"📲 **Si deseas hacer una compra, elige la opción 2.**"
);
                break;
            case "2":
                await ctxFn.gotoFlow(buyFlow);
                break;
            case "3":
                await ctxFn.gotoFlow(faqFlow);
                break;
            case "4":
                await ctxFn.flowDynamic("☎️ Para hablar con un trabajador, comunícate al +56 9 1234 5678.");
                break;
            case "5":
                await ctxFn.flowDynamic("Gracias por visitarnos. ¡Vuelve pronto! 👋");
                break;
            default:
                await ctxFn.flowDynamic("Opción no válida. Escribe 'Menu' para ver las opciones nuevamente.");
                break;
        }
    });

// Flujo para la opción 2 (hacer una compra)
const buyFlow = addKeyword(["2"])
    .addAnswer(
        "¿Cómo deseas recibir tu pedido?\n\n" +
"📍 **Retiro en tienda:** Escribe **'presencial'** para recoger tu pedido en nuestra tienda.\n\n" +
"🚚 **Envío a domicilio:** Escribe **'online'** para que te enviemos el pedido a tu dirección."
,
        { capture: true },
        async (ctx, ctxFn) => {
            const option = ctx.body.trim().toLowerCase(); // Convertimos a minúsculas para evitar errores de mayúsculas

            if (option === "presencial") {
                await ctxFn.flowDynamic("📍 Puedes retirar tu pedido en nuestra tienda. ¡Te esperamos!");
            } else if (option === "online") {
                await ctxFn.flowDynamic("🏠 Envío a domicilio disponible. Por favor, indícanos tu dirección para coordinar la entrega.");
                
                // Aquí esperamos la captura de la dirección
                return addKeyword(["*"])  // Usamos un wildcard para capturar cualquier respuesta
                    .addAnswer("✍️ Por favor, escribe tu dirección:", { capture: true }, async (ctx, ctxFn) => {
                        const address = ctx.body.trim();
                        await ctxFn.flowDynamic(`✅ Perfecto, enviaremos tu pedido a: ${address}. ¡Gracias por tu compra!`);
                    });
            } else {
                await ctxFn.flowDynamic("❌ Opción no válida. Por favor, escribe 'presencial' o 'online'.");
            }
        }
    );

const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAnswer([
       "🌿 **¡Hola y bienvenido a Agricola Ancestral!** 👋\n\n" +
"**Estoy aquí para ayudarte a elegir los mejores productos frescos** 🍅🥬.\n\n" +
"Para empezar, solo escribe **'Menu'** y podrás ver todas las opciones disponibles. ¡Así podrás probar cómo interactúo contigo! 😄"

    ]);



// Flujo para la opción 3 (preguntas frecuentes)
const faqFlow = addKeyword(["3"])
    .addAnswer(
        "✋ **¿En qué te podemos ayudar?**\n\n" +
"Escribe el número correspondiente a tu pregunta o escribe directamente lo que deseas saber:\n\n" +
"1️⃣ **¿Cuál es el horario de atención?**\n" +
"2️⃣ **¿Hacen envíos a domicilio?**\n" +
"3️⃣ **¿Cuál es la dirección de la tienda?**\n" +
"4️⃣ **¿Cuál es el número de contacto?**\n" +
"5️⃣ **Salir de la sección de preguntas**. Si deseas hacer una pregunta que no esté en la lista, **escríbela directamente**."
,
        { capture: true, delay: 800 },
        async (ctx, ctxFn) => {
            const faqResponse = {
                "1": "Nuestro horario de atención es de lunes a sábado de 9:00 a 18:00.",
                "2": "Sí, realizamos envíos a domicilio dentro de la ciudad. Consulta disponibilidad según tu ubicación.",
                "3": "Nuestra tienda está ubicada en Calle Principal 123, Ciudad.",
                "4": "Puedes contactarnos al +56 9 1234 5678.",
            };

            const text = ctx.body.trim();
            if (text === "5") {
                await ctxFn.flowDynamic("Gracias por tu visita. ¡Hasta pronto! 👋 Si tienes otra consulta, no dudes en escribir.");
            } else if (faqResponse[text]) {
                await ctxFn.flowDynamic(faqResponse[text]);
            } else {
                // Llamada a la IA de Gemini para responder preguntas no listadas
                const prompt = "Eres un asistente virtual de una tienda de verdulería que responde preguntas de forma clara y concisa. Las verduras que ofrecemos son frescas y de calidad, además de las frutas que son frescas y de calidad. A continuación se presentan algunas preguntas frecuentes si escribe el número o la pregunta:\n1. ¿Cuál es el horario de atención?\n2. ¿Hacen envíos a domicilio?\n3. ¿Cuál es la dirección de la tienda?\n4. ¿Cuál es el número de contacto?\n5. Escribe tu pregunta:";
                const response = await chat(prompt, text);
                await ctxFn.flowDynamic(response);
            }
        }
    );






const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, menuFlow, buyFlow, faqFlow])
    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
