import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatbotConversation } from './entities';
import { SendMessageDto, FeedbackDto } from './dto';
import { UsersService } from 'src/users/users.service';
import { TeamsService } from 'src/teams/teams.service';
import { RolesService } from 'src/roles/roles.service';

interface Intent {
  name: string;
  patterns: string[];
  responses: Record<string, string[]>;
  quickReplies: Record<string, string[]>;
  action?: string;
}

interface FAQItem {
  question: string[];
  answer: Record<string, string[]>;
}

interface FAQCategory {
  name: string;
  questions: FAQItem[];
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  private intents: Intent[] = [];
  private faqCategories: FAQCategory[] = [];
  private readonly defaultLanguage = 'en';

  constructor(
    @InjectModel(ChatbotConversation.name)
    private conversationModel: Model<ChatbotConversation>,
    private usersService: UsersService,
    private teamsService: TeamsService,
    private rolesService: RolesService,
  ) {
    this.initializeIntents();
    this.initializeFAQs();
  }

  onModuleInit() {
    this.initializeIntents();
    this.initializeFAQs();
  }

  private initializeFAQs() {
    this.faqCategories = [
      // Site Creation FAQ
      {
        name: 'site_creation',
        questions: [
          {
            question: ['how to create a construction site', 'create new site', 'add site', 'créer un chantier', 'créer un site', 'comment créer un site', 'إنشاء موقع بناء', 'كيفية إنشاء موقع'],
            answer: {
              en: ['To create a new construction site, follow these steps:\n\n1. Go to the Sites page from the dashboard\n2. Click the "Add New Site" button\n3. Fill in the site details (name, address, coordinates)\n4. Set the budget and timeline\n5. Assign teams and equipment\n6. Click "Create" to save\n\nThe site will be created and you can start managing it.'],
              fr: ['Pour créer un nouveau chantier, suivez ces étapes:\n\n1. Allez sur la page Sites depuis le tableau de bord\n2. Cliquez sur le bouton "Ajouter un site"\n3. Remplissez les détails du site (nom, adresse, coordonnées)\n4. Définissez le budget et le calendrier\n5. Assignez des équipes et équipements\n6. Cliquez sur "Créer" pour enregistrer\n\nLe site sera créé et vous pourrez commencer à le gérer.'],
              ar: ['لإنشاء موقع بناء جديد، اتبع هذه الخطوات:\n\n1. انتقل إلى صفحة المواقع من لوحة التحكم\n2. انقر على زر "إضافة موقع جديد"\n3. املأ تفاصيل الموقع (الاسم، العنوان، الإحداثيات)\n4. حدد الميزانية والجدول الزمني\n5. عيّن الفرق والمعدات\n6. انقر على "إنشاء" للحفظ\n\nسيتم إنشاء الموقع ويمكنك البدء في إدارته.'],
            },
          },
          {
            question: ['site requirements', 'what do i need for a site', 'requirements for site', 'conditions pour créer un site', 'متطلبات إنشاء موقع'],
            answer: {
              en: ['To create a construction site, you need:\n\n• Site name and address\n• GPS coordinates\n• Budget allocation\n• Project timeline\n• Assigned team members\n• Required permits (if applicable)\n• Safety equipment\n\nMake sure you have admin access to create sites.'],
              fr: ['Pour créer un chantier, vous avez besoin de:\n\n• Nom et adresse du site\n• Coordonnées GPS\n• Attribution du budget\n• Calendrier du projet\n• Membres de l\'équipe assignés\n• Permis requis (si applicable)\n• Équipements de sécurité\n\nAssurez-vous d\'avoir un accès admin pour créer des sites.'],
              ar: ['لإنشاء موقع بناء، تحتاج إلى:\n\n• اسم الموقع والعنوان\n• إحداثيات نظام تحديد المواقع\n• تخصيص الميزانية\n• الجدول الزمني للمشروع\n• أعضاء الفريق المعينين\n• التصاريح المطلوبة (إن وجدت)\n• معدات السلامة\n\nتأكد من أن لديك وصول مسؤول لإنشاء المواقع.'],
            },
          },
        ],
      },
      // Team Management FAQ
      {
        name: 'team_management',
        questions: [
          {
            question: ['how to create a team', 'create team', 'add team', 'new team', 'creer une equipe', 'creer equipe', 'ajouter equipe', 'comment creer equipe', 'انشاء فريق', 'كيفية انشاء فريق', 'comment creer une equipe'],
            answer: {
              en: ['To create a new team:\n\n1. Go to the Team page from the dashboard\n2. Click the Add New Team button\n3. Enter team name and description\n4. Add members to the team\n5. Assign a team manager\n6. Link the team to a site (optional)\n7. Click Create to save\n\nThe team will be created and you can manage its members and tasks.'],
              fr: ['Pour créer une nouvelle équipe:\n\n1. Allez sur la page Équipe depuis le tableau de bord\n2. Cliquez sur le bouton Ajouter une nouvelle équipe\n3. Entrez le nom et la description\n4. Ajoutez des membres à l\'équipe\n5. Assignez un responsable\n6. Liez l\'équipe à un site (optionnel)\n7. Cliquez sur Créer pour enregistrer\n\nL\'équipe sera créée et vous pourrez gérer ses membres.'],
              ar: ['لإنشاء فريق جديد:\n\n1. انتقل إلى صفحة الفريق من لوحة التحكم\n2. انقر على زر إضافة فريق جديد\n3. أدخل اسم الفريق ووصفه\n4. أضف أعضاء إلى الفريق\n5. عيّن مدير الفريق\n6. اربط الفريق بموقع (اختياري)\n7. انقر على إنشاء للحفظ\n\nسيتم إنشاء الفريق ويمكنك إدارة أعضائه ومهامه.'],
            },
          },
          {
            question: ['how to add a worker', 'add new worker', 'add team member', 'ajouter un ouvrier', 'ajouter un membre', 'إضافة عامل جديد', 'كيفية إضافة عامل'],
            answer: {
              en: ['To add a new worker to your team:\n\n1. Navigate to Team Management\n2. Click "Add New Member"\n3. Enter worker details (name, CIN, contact)\n4. Assign a role and responsibilities\n5. Set their schedule and site assignment\n6. Save the worker profile\n\nThe worker will receive login credentials.'],
              fr: ['Pour ajouter un nouvel ouvrier à votre équipe:\n\n1. Accédez à la Gestion d\'équipe\n2. Cliquez sur "Ajouter un nouveau membre"\n3. Entrez les détails de l\'ouvrier (nom, CIN, contact)\n4. Assignez un rôle et des responsabilités\n5. Définissez leur horaire et assignation de site\n6. Enregistrez le profil de l\'ouvrier\n\nL\'ouvrier recevra ses identifiants de connexion.'],
              ar: ['لإضافة عامل جديد إلى فريقك:\n\n1. انتقل إلى إدارة الفريق\n2. انقر على "إضافة عضو جديد"\n3. أدخل تفاصيل العامل (الاسم، رقم الهوية، جهة الاتصال)\n4. عيّن دورا ومسؤوليات\n5. حدد الجدول الزمني وتعيين الموقع\n6. حفظ ملف العامل\n\nسيتلقى العامل بيانات اعتماد تسجيل الدخول.'],
            },
          },
        ],
      },
      // Safety Guidelines FAQ
      {
        name: 'safety',
        questions: [
          {
            question: ['safety guidelines', 'safety rules', 'safety requirements', 'consignes de sécurité', 'règles de sécurité', 'إرشادات السلامة', 'قواعد السلامة'],
            answer: {
              en: ['Essential safety guidelines for construction sites:\n\n1. Always wear PPE (helmet, vest, boots)\n2. Follow proper lifting techniques\n3. Keep work areas clean and organized\n4. Use equipment properly\n5. Report hazards immediately\n6. Attend safety training\n7. Know emergency exits\n\nSafety is everyone\'s responsibility!'],
              fr: ['Consignes de sécurité essentielles pour les chantiers:\n\n1. Portez toujours des EPI (casque, gilet, bottes)\n2. Suivez les techniques de levage appropriées\n3. Gardez les zones de travail propres\n4. Utilisez correctement les équipements\n5. Signalez les dangers immédiatement\n6. Assistez à la formation sécurité\n7. Connaissez les sorties d\'urgence\n\nLa sécurité est la responsabilité de tous!'],
              ar: ['إرشادات السلامة الأساسية لمواقع البناء:\n\n1. ارتدي معدات الحماية الشخصية (الخوذة، السترة، الأحذية)\n2. اتبع تقنيات الرفع المناسبة\n3. حافظ على مناطق العمل نظيفة ومنظمة\n4. استخدم المعدات بشكل صحيح\n5. أبلغ عن المخاطر فورا\n6. حضور تدريب السلامة\n7. اعرف مخارج الطوارئ\n\nالسلامة مسؤولية الجميع!'],
            },
          },
        ],
      },
    ];
  }

  private initializeIntents() {
    this.intents = [
      // Greetings
      {
        name: 'greeting',
        patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'bonjour', 'salut', 'مرحبا', 'اهلا', 'كيف حالك'],
        responses: {
          en: ['Hello! How can I help you today?', 'Hi there! What can I assist you with?'],
          fr: ['Bonjour ! Comment puis-je vous aider ?', 'Salut ! Que puis-je faire pour vous ?'],
          ar: ['مرحبا ! كيف يمكنني مساعدتك؟', 'اهلا ! ما الذي يمكنني مساعدتك به؟'],
        },
        quickReplies: {
          en: ['Show my tasks', 'View site status', 'Get help'],
          fr: ['Afficher mes tâches', 'Voir le statut du site', 'Obtenir de l\'aide'],
          ar: ['عرض مهامي', 'عرض حالة الموقع', 'الحصول على مساعدة'],
        },
      },
      // Get Users
      {
        name: 'get_users',
        patterns: ['show users', 'list users', 'all users', 'show workers', 'list workers', 'afficher les utilisateurs', 'afficher les ouvrières', 'عرض المستخدمين', 'عرض العمال'],
        responses: {
          en: ['Fetching users from the system...', 'Loading users...'],
          fr: ['Récupération des utilisateurs du système...', 'Chargement des utilisateurs...'],
          ar: ['جاري جلب المستخدمين من النظام...', 'جاري تحميل المستخدمين...'],
        },
        action: 'fetch_users',
        quickReplies: {
          en: ['Show active users', 'Show pending users', 'Add new user'],
          fr: ['Afficher les utilisateurs actifs', 'Afficher les utilisateurs en attente', 'Ajouter un nouvel utilisateur'],
          ar: ['عرض المستخدمين النشطين', 'عرض المستخدمين المعلقين', 'إضافة مستخدم جديد'],
        },
      },
      // Get Teams
      {
        name: 'get_teams',
        patterns: ['show teams', 'list teams', 'all teams', 'show workers', 'list workers', 'afficher les équipes', 'afficher les ouvrières', 'عرض الفرق', 'عرض العمال'],
        responses: {
          en: ['Fetching teams from the system...', 'Loading teams...'],
          fr: ['Récupération des équipes du système...', 'Chargement des équipes...'],
          ar: ['جاري جلب الفرق من النظام...', 'جاري تحميل الفرق...'],
        },
        action: 'fetch_teams',
        quickReplies: {
          en: ['Show team details', 'Add new team', 'Team members'],
          fr: ['Afficher les détails de l\'équipe', 'Ajouter une nouvelle équipe', 'Membres de l\'équipe'],
          ar: ['عرض تفاصيل الفريق', 'إضافة فريق جديد', 'أعضاء الفريق'],
        },
      },
      // Get Roles
      {
        name: 'get_roles',
        patterns: ['show roles', 'list roles', 'all roles', 'afficher les rôles', 'عرض الأدوار'],
        responses: {
          en: ['Fetching roles from the system...', 'Loading roles...'],
          fr: ['Récupération des rôles du système...', 'Chargement des rôles...'],
          ar: ['جاري جلب الأدوار من النظام...', 'جاري تحميل الأدوار...'],
        },
        action: 'fetch_roles',
        quickReplies: {
          en: ['Admin role', 'Manager role', 'Worker role'],
          fr: ['Rôle administrateur', 'Rôle gestionnaire', 'Rôle ouvrier'],
          ar: ['دور المسؤول', 'دور المدير', 'دور العامل'],
        },
      },
      // Default fallback
      {
        name: 'fallback',
        patterns: [],
        responses: {
          en: [
            'I\'m not sure I understand. Could you rephrase?',
            'I can help you with tasks, sites, teams, equipment, safety, deadlines, reports, users, and roles. What would you like to know?',
            'Ask me about:\n• Creating and managing sites\n• Adding workers\n• Tasks and deadlines\n• Equipment management\n• Safety guidelines\n• Reports and analytics\n• User management\n• Role management',
          ],
          fr: [
            'Je ne suis pas sûr de comprendre. Pourriez-vous reformuler ?',
            'Je peux vous aider avec les tâches, les sites, les équipes, les équipements, la sécurité, les échéances, les rapports, les utilisateurs et les rôles. Que aimeriez-vous savoir?',
            'Posez-moi des questions sur:\n• Créer et gérer des sites\n• Ajouter des travailleurs\n• Tâches et échéances\n• Gestion des équipements\n• Consignes de sécurité\n• Rapports et analyses\n• Gestion des utilisateurs\n• Gestion des rôles',
          ],
          ar: [
            'لست متأكدا من الفهم. هل يمكنك إعادة الصياغة؟',
            'يمكنني مساعدتك في المهام والمواقع والفرق والمعدات والسلامة والمواعيد النهائية والتقارير والمستخدمين والأدوار. ما الذي تريد معرفته؟',
            'اسألني عن:\n• إنشاء وإدارة المواقع\n• إضافة العمال\n• المهام والمواعيد النهائية\n• إدارة المعدات\n• إرشادات السلامة\n• التقارير والتحليلات\n• إدارة المستخدمين\n• إدارة الأدوار',
          ],
        },
        quickReplies: {
          en: ['How to create a site', 'How to create a team', 'Show my tasks', 'Safety guidelines', 'Show users', 'Show roles'],
          fr: ['Comment créer un site', 'Comment créer une équipe', 'Afficher mes tâches', 'Consignes de sécurité', 'Afficher les utilisateurs', 'Afficher les rôles'],
          ar: ['كيفية إنشاء موقع', 'كيفية إنشاء فريق', 'عرض مهامي', 'إرشادات السلامة', 'عرض المستخدمين', 'عرض الأدوار'],
        },
      },
    ];
  }

  async sendMessage(userId: string, userRole: string, dto: SendMessageDto) {
    const { message, language = this.defaultLanguage, conversationId, intent, context } = dto;

    // Find or create conversation
    let conversation: ChatbotConversation | null;
    if (conversationId) {
      conversation = await this.conversationModel.findById(conversationId);
    } else {
      conversation = await this.conversationModel.findOne({ userId: new Types.ObjectId(userId), status: 'active' });
    }

    if (!conversation) {
      conversation = new this.conversationModel({
        userId: new Types.ObjectId(userId),
        userRole,
        language,
        messages: [],
        status: 'active',
      });
    }

    // FIRST: Check for FAQ match - this has absolute priority
    const faqResponse = this.searchFAQ(message, language);
    const lang = conversation.language || language;

    // Only detect intent if no FAQ match
    const detectedIntent = !faqResponse ? (intent ? this.intents.find(i => i.name === intent) || this.detectIntent(message) : this.detectIntent(message)) : null;

    let responseText: string;
    if (faqResponse) {
      responseText = faqResponse;
    } else if (detectedIntent?.action) {
      responseText = await this.processAction(detectedIntent.action, lang);
    } else {
      responseText = this.generateResponse(detectedIntent, lang);
    }

    // Add messages to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    conversation.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    });

    await conversation.save();

    return {
      success: true,
      message: 'Message processed successfully',
      data: {
        conversationId: conversation._id.toString(),
        responses: [responseText],
        suggestions: this.getContextualSuggestions(detectedIntent, lang),
        quickReplies: detectedIntent?.quickReplies[lang as keyof typeof detectedIntent.quickReplies] || [],
        metadata: {
          detectedIntent: detectedIntent?.name,
          action: detectedIntent?.action,
          fromFAQ: !!faqResponse,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async processAction(action: string, language: string): Promise<string> {
    try {
      switch (action) {
        case 'fetch_users':
          const users = await this.usersService.findAll();
          return this.formatUsersResponse(users, language);
        case 'fetch_teams':
          const teams = await this.teamsService.findAll();
          return this.formatTeamsResponse(teams, language);
        case 'fetch_roles':
          const roles = await this.rolesService.findAll();
          return this.formatRolesResponse(roles, language);
        default:
          return this.generateResponse(null, language);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      return language === 'ar' ? 'عذرا، حدث خطأ أثناء جلب البيانات.' : language === 'fr' ? 'Désolé, une erreur s\'est produite lors de la récupération des données.' : 'Sorry, an error occurred while fetching data.';
    }
  }

  private formatUsersResponse(users: any, language: string): string {
    if (!users || users.length === 0) {
      return language === 'ar' ? 'لا توجد مستخدمين في النظام.' : language === 'fr' ? 'Il n\'y a pas d\'utilisateurs dans le système.' : 'There are no users in the system.';
    }

    const userList = users.slice(0, 5).map((user: any) => {
      const name = `${user.firstName} ${user.lastName}`;
      const role = user.role?.name || 'N/A';
      const status = user.isActif ? (language === 'ar' ? 'نشط' : language === 'fr' ? 'Actif' : 'Active') : (language === 'ar' ? 'غير نشط' : language === 'fr' ? 'Inactif' : 'Inactive');
      return `- ${name} (${role}) - ${status}`;
    }).join('\n');

    const moreText = users.length > 5 ? `\n${language === 'ar' ? `و ${users.length - 5} آخرين...` : language === 'fr' ? `Et ${users.length - 5} autres...` : `And ${users.length - 5} more...`}` : '';

    const header = language === 'ar' ? '📋 المستثمرون:' : language === 'fr' ? '📋 Utilisateurs:' : '📋 Users:';
    return `${header}\n${userList}${moreText}`;
  }

  private formatTeamsResponse(teams: any, language: string): string {
    if (!teams || teams.length === 0) {
      return language === 'ar' ? 'لا توجد فرق في النظام.' : language === 'fr' ? 'Il n\'y a pas d\'équipes dans le système.' : 'There are no teams in the system.';
    }

    const teamList = teams.slice(0, 5).map((team: any) => {
      const memberCount = team.members?.length || 0;
      return `- ${team.name} (${memberCount} members)`;
    }).join('\n');

    const moreText = teams.length > 5 ? `\n${language === 'ar' ? `و ${teams.length - 5} فرق أخرى...` : language === 'fr' ? `Et ${teams.length - 5} autres équipes...` : `And ${teams.length - 5} more teams...`}` : '';

    const header = language === 'ar' ? '👥 الفرق:' : language === 'fr' ? '👥 Équipes:' : '👥 Teams:';
    return `${header}\n${teamList}${moreText}`;
  }

  private formatRolesResponse(roles: any, language: string): string {
    if (!roles || roles.length === 0) {
      return language === 'ar' ? 'لا توجد أدوار في النظام.' : language === 'fr' ? 'Il n\'y a pas de rôles dans le système.' : 'There are no roles in the system.';
    }

    const roleList = roles.map((role: any) => `- ${role.name}`).join('\n');

    const header = language === 'ar' ? '🔐 الأدوار:' : language === 'fr' ? '🔐 Rôles:' : '🔐 Roles:';
    return `${header}\n${roleList}`;
  }

  private searchFAQ(message: string, language: string): string | null {
    const normalizedMessage = message.toLowerCase().trim();

    // 1. Team creation - specific match (MUST be checked first)
    if (normalizedMessage.includes('create') && normalizedMessage.includes('team') || 
        normalizedMessage.includes('creer') && normalizedMessage.includes('equipe') ||
        normalizedMessage.includes('comment creer une equipe') ||
        normalizedMessage.includes('how to create a team') ||
        normalizedMessage.includes('new team') ||
        normalizedMessage.includes('ajouter equipe')) {
      return language === 'fr' ? 
        'Pour créer une nouvelle équipe:\n\n1. Allez sur la page Équipe depuis le tableau de bord\n2. Cliquez sur le bouton Ajouter une nouvelle équipe\n3. Entrez le nom et la description\n4. Ajoutez des membres à l\'équipe\n5. Assignez un responsable\n6. Liez l\'équipe à un site (optionnel)\n7. Cliquez sur Créer pour enregistrer\n\nL\'équipe sera créée et vous pourrez gérer ses membres.' :
        'To create a new team:\n\n1. Go to the Team page from the dashboard\n2. Click the Add New Team button\n3. Enter team name and description\n4. Add members to the team\n5. Assign a team manager\n6. Link the team to a site (optional)\n7. Click Create to save\n\nThe team will be created and you can manage its members and tasks.';
    }

    // 2. Site creation - specific match
    if (normalizedMessage.includes('create') && normalizedMessage.includes('site') || 
        normalizedMessage.includes('creer') && normalizedMessage.includes('site') ||
        normalizedMessage.includes('comment créer un site') ||
        normalizedMessage.includes('how to create a construction site') ||
        normalizedMessage.includes('how to create a new construction site') ||
        normalizedMessage.includes('new construction site')) {
      return language === 'fr' ?
        'Pour créer un nouveau chantier:\n\n1. Allez sur la page Sites depuis le tableau de bord\n2. Cliquez sur le bouton "Ajouter un site"\n3. Remplissez les détails du site (nom, adresse, coordonnées)\n4. Définissez le budget et le calendrier\n5. Assignez des équipes et équipements\n6. Cliquez sur "Créer" pour enregistrer\n\nLe site sera créé et vous pourrez commencer à le gérer.' :
        'To create a new construction site, follow these steps:\n\n1. Go to the Sites page from the dashboard\n2. Click the "Add New Site" button\n3. Fill in the site details (name, address, coordinates)\n4. Set the budget and timeline\n5. Assign teams and equipment\n6. Click "Create" to save\n\nThe site will be created and you can start managing it.';
    }

    // 3. Safety guidelines
    if (normalizedMessage.includes('safety') || 
        normalizedMessage.includes('consignes') ||
        normalizedMessage.includes('sécurité')) {
      return language === 'fr' ?
        'Consignes de sécurité essentielles pour les chantiers:\n\n1. Portez toujours des EPI (casque, gilet, bottes)\n2. Suivez les techniques de levage appropriées\n3. Gardez les zones de travail propres\n4. Utilisez correctement les équipements\n5. Signalez les dangers immédiatement\n6. Assistez à la formation sécurité\n7. Connaissez les sorties d\'urgence\n\nLa sécurité est la responsabilité de tous!' :
        'Essential safety guidelines for construction sites:\n\n1. Always wear PPE (helmet, vest, boots)\n2. Follow proper lifting techniques\n3. Keep work areas clean and organized\n4. Use equipment properly\n5. Report hazards immediately\n6. Attend safety training\n7. Know emergency exits\n\nSafety is everyone\'s responsibility!';
    }

    // Check FAQ categories for other matches
    if (this.faqCategories && this.faqCategories.length > 0) {
      for (const category of this.faqCategories) {
        for (const faq of category.questions) {
          for (const pattern of faq.question) {
            const normalizedPattern = pattern.toLowerCase();
            if (normalizedMessage.includes(normalizedPattern) || normalizedPattern.includes(normalizedMessage)) {
              const answers = faq.answer[language as keyof typeof faq.answer] || faq.answer['en'];
              return answers[0];
            }
          }
        }
      }
    }

    return null;
  }

  private getContextualSuggestions(intent: Intent | null, language: string): string[] {
    if (!intent) {
      return [
        language === 'ar' ? 'كيفية إنشاء موقع' : language === 'fr' ? 'Comment créer un site' : 'How to create a site',
        language === 'ar' ? 'عرض المستخدمين' : language === 'fr' ? 'Afficher les utilisateurs' : 'Show users',
        language === 'ar' ? 'عرض الفرق' : language === 'fr' ? 'Afficher les équipes' : 'Show teams',
        language === 'ar' ? 'عرض الأدوار' : language === 'fr' ? 'Afficher les rôles' : 'Show roles',
      ];
    }

    const suggestions: Record<string, Record<string, string[]>> = {
      get_users: {
        en: ['Active users', 'Pending users', 'Add new user'],
        fr: ['Utilisateurs actifs', 'Utilisateurs en attente', 'Ajouter un utilisateur'],
        ar: ['المستخدمون النشطون', 'المستخدمون المعلقون', 'إضافة مستخدم جديد'],
      },
      get_teams: {
        en: ['Team details', 'Add new team', 'Team members'],
        fr: ['Détails de l\'équipe', 'Ajouter une nouvelle équipe', 'Membres de l\'équipe'],
        ar: ['تفاصيل الفريق', 'إضافة فريق جديد', 'أعضاء الفريق'],
      },
      get_roles: {
        en: ['Admin role', 'Manager role', 'Worker role'],
        fr: ['Rôle administrateur', 'Rôle gestionnaire', 'Rôle ouvrier'],
        ar: ['دور المسؤول', 'دور المدير', 'دور العامل'],
      },
      safety: {
        en: ['PPE requirements', 'Emergency procedures', 'Safety training'],
        fr: ['Exigences EPI', 'Procédures d\'urgence', 'Formation sécurité'],
        ar: ['متطلبات المعدات', 'إجراءات الطوارئ', 'تدريب السلامة'],
      },
    };

    return suggestions[intent.name]?.[language] || suggestions[intent.name]?.['en'] || [];
  }

  private detectIntent(message: string): Intent | null {
    const normalizedMessage = message.toLowerCase().trim();

    for (const intent of this.intents) {
      for (const pattern of intent.patterns) {
        if (normalizedMessage.includes(pattern.toLowerCase())) {
          return intent;
        }
      }
    }

    return this.intents.find(i => i.name === 'fallback') || null;
  }

  private generateResponse(intent: Intent | null, language: string): string {
    if (!intent) {
      const fallback = this.intents.find(i => i.name === 'fallback');
      return fallback?.responses[language as keyof typeof fallback.responses]?.[0] || fallback?.responses['en'][0] || 'I\'m not sure I understand.';
    }

    const responses = intent.responses[language as keyof typeof intent.responses] || intent.responses['en'];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async getConversation(userId: string, conversationId: string | undefined, limit?: number) {
    try {
      let conversation = await this.conversationModel.findById(conversationId);
      
      if (!conversation || conversation.userId.toString() !== userId) {
        conversation = await this.conversationModel.findOne({ 
          userId: new Types.ObjectId(userId), 
          status: 'active' 
        });
      }

      if (!conversation) {
        return {
          success: true,
          message: 'No active conversation found',
          data: {
            conversationId: null,
            messages: [],
            suggestions: ['How to create a site', 'Show users', 'Show teams', 'Show roles'],
            quickReplies: ['How to create a site', 'Show users', 'Show teams', 'Show roles'],
          },
          timestamp: new Date().toISOString(),
        };
      }

      const messages = limit ? conversation.messages.slice(-limit) : conversation.messages;

      return {
        success: true,
        message: 'Conversation retrieved successfully',
        data: {
          conversationId: conversation._id.toString(),
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          language: conversation.language,
          status: conversation.status,
          suggestions: ['How to create a site', 'Show users', 'Show teams', 'Show roles'],
          quickReplies: ['How to create a site', 'Show users', 'Show teams', 'Show roles'],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      return {
        success: false,
        message: 'Error retrieving conversation',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getConversations(userId: string, limit = 10) {
    try {
      const conversations = await this.conversationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .limit(limit);

      return {
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations.map(c => ({
          conversationId: c._id.toString(),
          lastMessage: c.messages[c.messages.length - 1]?.content || '',
          language: c.language,
          status: c.status,
          messageCount: c.messages.length,
          createdAt: (c as any).createdAt || new Date(),
          updatedAt: (c as any).updatedAt || new Date(),
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: false,
        message: 'Error retrieving conversations',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    try {
      const conversation = await this.conversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(userId),
      });

      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
          timestamp: new Date().toISOString(),
        };
      }

      conversation.status = 'archived';
      await conversation.save();

      return {
        success: true,
        message: 'Conversation deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        success: false,
        message: 'Error deleting conversation',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async submitFeedback(userId: string, dto: FeedbackDto) {
    try {
      const conversation = await this.conversationModel.findOne({
        _id: new Types.ObjectId(dto.conversationId),
        userId: new Types.ObjectId(userId),
      });

      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
          timestamp: new Date().toISOString(),
        };
      }

      const messageIndex = parseInt(dto.messageId);
      if (messageIndex >= 0 && messageIndex < conversation.messages.length) {
        (conversation.messages[messageIndex] as any).feedback = dto.feedback;
        (conversation.messages[messageIndex] as any).comment = dto.comment;
        await conversation.save();
      }

      return {
        success: true,
        message: 'Feedback submitted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return {
        success: false,
        message: 'Error submitting feedback',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSuggestedQuestions(language = 'en') {
    const questions: Record<string, string[]> = {
      en: [
        'How to create a new construction site?',
        'How to create a team?',
        'Show my tasks',
        'Safety guidelines',
      ],
      fr: [
        'Comment créer un nouveau chantier?',
        'Comment créer une équipe?',
        'Afficher mes tâches',
        'Consignes de sécurité',
      ],
      ar: [
        'كيفية إنشاء موقع بناء جديد؟',
        'كيفية إنشاء فريق؟',
        'عرض مهامي',
        'إرشادات السلامة',
      ],
    };

    return {
      success: true,
      message: 'Suggested questions retrieved successfully',
      data: {
        questions: questions[language] || questions['en'],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async processQuickCommand(userId: string, userRole: string, command: string, language: string) {
    const commandMap: Record<string, string> = {
      '/tasks': 'show_tasks',
      '/sites': 'site_info',
      '/teams': 'get_teams',
      '/help': 'technical_support',
      '/status': 'show_tasks',
      '/deadlines': 'deadlines',
      '/report': 'reports',
      '/users': 'get_users',
      '/roles': 'get_roles',
    };

    const intentName = commandMap[command.toLowerCase()];
    const intent = this.intents.find(i => i.name === intentName);

    if (intent?.action) {
      const response = await this.processAction(intent.action, language);
      return {
        success: true,
        message: 'Command processed successfully',
        data: {
          conversationId: '',
          responses: [response],
          suggestions: this.getContextualSuggestions(intent, language),
          quickReplies: [],
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      message: 'Unknown command',
      data: {
        conversationId: '',
        responses: [this.generateResponse(intent || null, language)],
        suggestions: [],
        quickReplies: [],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async analyzeImage(userId: string, userRole: string, image: any, language: string) {
    // Placeholder for image analysis
    const analysis = language === 'ar' 
      ? 'تحليل الصور قيد التنفيذ. يرجى الانتظار.'
      : language === 'fr'
      ? 'Analyse d\'image en cours. Veuillez patienter.'
      : 'Image analysis in progress. Please wait.';

    return {
      success: true,
      message: 'Image analysis processed',
      data: {
        conversationId: '',
        responses: [analysis],
        suggestions: ['More details about this site', 'Safety status', 'Team information'],
        quickReplies: [],
        metadata: {
          imageAnalysis: 'Construction site analysis',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async processVoiceMessage(userId: string, userRole: string, audio: any, language: string) {
    // Placeholder for voice processing
    const transcription = language === 'ar'
      ? 'تم معالجة الرسالة الصوتية'
      : language === 'fr'
      ? 'Message vocal traité'
      : 'Voice message processed';

    return {
      success: true,
      message: 'Voice message processed',
      data: {
        conversationId: '',
        responses: [transcription],
        suggestions: ['Show my tasks', 'View site status'],
        quickReplies: [],
        metadata: {
          transcription: transcription,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
