import * as THREE from 'three';

/**
 * Provides the interactive dialogue definitions for the portfolio showcase.
 * These are centered around Abdullah Faruk Çiftler's career and skills.
 */
export function getInteractions() {
    return [
        {
            id: 'info_booth',
            pos: new THREE.Vector3(-24.1, 0, 11.5),
            radius: 4.5,
            name: 'Faruk',
            portraitUrl: './farukchar.png',
            text: 'Merhaba! Ben Faruk. ZortEngine Showcase\'e hoş geldin. Burası benim interaktif portfolyo dünyam. Kariyerim, projelerim veya yetkinliklerim hakkında neler bilmek istersin?',
            choices: [
                {
                    text: 'Kariyer yolculuğundan bahset.',
                    nextText: 'Yazılım geliştirici (Software Developer) kökenli bir Ürün Müdürü\'yüm (Product Manager). Inveon, New Mind ve PeP gibi yerlerde kod yazdıktan sonra Wugo ve Boyner\'de ürün yönetimine odaklandım.',
                    nextChoices: [
                        { 
                            text: 'Şu an ne yapıyorsun?', 
                            nextText: 'Boyner\'de Senior AI Product Manager olarak çalışıyorum. Fraud engine dönüşümü ve PRD otomasyonu gibi ML projelerini yönetiyorum.' 
                        },
                        { 
                            text: 'Girişimcilik geçmişin var mı?', 
                            nextText: 'Evet! Locup adında bir SaaS girişimini kurup exit ettim. Şu an MakeItProduct (Venture Studio) ile yeni ürünler geliştirmeye devam ediyorum.' 
                        },
                        { 
                            text: 'Özel bir projenden bahset?', 
                            nextText: 'TÜBİTAK tarafından fonlanan, makinelerin enerji kullanımını sınıflandıran "Akıllı Priz" (Smart Plug) projem var. Ayrıca mobil oyunlar da (GuessFour, Sequences) geliştirdim.' 
                        },
                        { 
                            text: 'Hangi binalar seninle alakalı?', 
                            nextText: 'Sokaktaki Boyner, Inveon, Wugo ve NewMind binaları kariyerimdeki durakları temsil ediyor. İçlerine girip neler yaptığımı inceleyebilirsin!' 
                        }
                    ]
                },
                {
                    text: 'Teknik yetkinliklerin neler?',
                    nextText: 'Python, TypeScript, Node.js ve .NET ekosistemine hakimim. Sadece kod yazmıyorum; AI araçlarını (Cursor, Antigravity, Copilot) profesyonelce kullanarak mimariyi koruyan hızlı çözümler üretiyorum.',
                    nextChoices: [
                        { 
                            text: 'AI ve ML tarafında neler var?', 
                            nextText: 'Predictive analytics, LLM entegrasyonları (OpenAI, Gemini, Ollama) ve veri hattı (ETL) otomasyonları konularında uzmanım.' 
                        },
                        { 
                            text: 'Hangi araçları kullanıyorsun?', 
                            nextText: 'Docker, PostgreSQL, Redis ve çeşitli bulut servislerini (VPS, CI/CD) projelerimde aktif olarak kullanıyorum.' 
                        }
                    ]
                },
                {
                    text: 'Sana nasıl ulaşabilirim?',
                    nextText: 'İş birliği veya soruların için ciftlerabdullah@gmail.com adresinden bana yazabilir ya da LinkedIn profilimden ulaşabilirsin. Tanıştığımıza memnun oldum!',
                    nextChoices: [
                        { text: 'Linkedin linkin var mı?', nextText: 'Tabii, Abdullah Faruk Çiftler olarak aratırsan hemen bulursun!' },
                        { text: 'Teşekkürler!', nextText: 'Rica ederim, keyifli keşifler!' }
                    ]
                }
            ]
        }
    ];
}
