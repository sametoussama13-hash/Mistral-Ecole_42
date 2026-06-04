import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:8000";

const CMA_CGM_LOGO = "data:image/png;base64,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";


// ── Auth config ───────────────────────────────────────────────────────────────
const USERS = [
  { username: "admin",   password: "admin2024",  role: "admin",  name: "Administrateur" },
  { username: "cyber1",  password: "cyber2024",  role: "cyber",  name: "Analyste Cyber" },
  { username: "cyber2",  password: "tpra2024",   role: "cyber",  name: "Équipe Cyber" },
];



// ── i18n ─────────────────────────────────────────────────────────────────────
const LANGS = {
  fr: { label:"Français",  flag:"🇫🇷", rtl:false },
  en: { label:"English",   flag:"🇬🇧", rtl:false },
  es: { label:"Español",   flag:"🇪🇸", rtl:false },
  ar: { label:"العربية",   flag:"🇸🇦", rtl:true  },
};

const T_ALL = {
  fr: {
    // Login
    login_title:"Connexion", login_subtitle:"Accès réservé aux membres de l'équipe",
    login_profile:"VOTRE PROFIL", login_admin:"Admin", login_admin_sub:"Gestion complète",
    login_cyber:"Analyste Cyber", login_cyber_sub:"Analyse & validation",
    login_id:"IDENTIFIANT", login_id_ph:"nom.utilisateur",
    login_pwd:"MOT DE PASSE", login_pwd_ph:"••••••••",
    login_btn:"Se connecter →", login_loading:"Connexion…",
    login_error:"Identifiants incorrects.", login_footer:"Accès sécurisé · CMA CGM Cybersécurité",
    // Header
    platform:"TPRA Platform", platform_sub:"THIRD PARTY RISK ASSESSMENT",
    role_admin:"ADMIN", role_cyber:"ANALYSTE CYBER",
    btn_refresh:"Actualiser", btn_new:"Nouveau ticket", btn_logout:"Quitter",
    btn_light:"Mode clair", btn_dark:"Mode sombre",
    // Dashboard
    greet:"Bonjour,", dashboard:"TABLEAU DE BORD",
    kpi_total:"Tickets total", kpi_running:"En cours", kpi_validate:"À valider",
    kpi_done:"Terminés", kpi_rejected:"Rejetés / Err.",
    kpi_one:"ticket", kpi_many:"tickets", kpi_none:"Aucun",
    // Table
    col_vendor:"Fournisseur", col_analyst:"Analyste / Validation",
    col_decision:"Décision", col_status:"Statut", col_date:"Date", col_actions:"Actions",
    btn_validate:"Valider", btn_excel:"Excel", btn_details:"Détails",
    btn_delete:"Supprimer", btn_deselect:"Désélectionner", btn_cancel:"Annuler",
    selected:"sélectionné", selected_p:"sélectionnés",
    validated_ai:"Approuvé par l'IA", validated_by:"Approuvé par",
    approved:"Approuvé", rejected:"Rejeté",
    // Filters
    filter_all:"Tous", filter_pending:"En attente", filter_running:"En cours",
    filter_validate:"À valider", filter_done:"Terminés", filter_rejected:"Rejetés", filter_errors:"Erreurs",
    search_ph:"Rechercher…", results:"résultat", results_p:"résultats", for:"pour",
    no_tickets:"Aucun ticket pour l'instant", no_results:"Aucun résultat pour",
    create_first:"Créer le premier ticket", loading:"Chargement…",
    // Modals
    new_ticket:"Nouveau ticket TPRA", new_subtitle:"Lancer une analyse de risque fournisseur",
    vendor:"Fournisseur *", project:"Projet", analyst:"Analyste",
    file:"Fichier * (.xlsx, .pdf, .txt)", drop_file:"Glissez un fichier ou cliquez pour parcourir",
    cancel:"Annuler", launch:"Lancer l'analyse", launching:"Lancement…",
    field_required:"Le fournisseur et le fichier sont requis.",
    // Detail
    executive_summary:"RÉSUMÉ EXÉCUTIF", showstoppers:"SHOWSTOPPERS",
    workflow:"PROGRESSION DU WORKFLOW", decision:"Décision", risk_level:"Niveau de risque",
    global_score:"Score global", questions:"Questions",
    scores_low:"Scores ≤ 2", risks_found:"Risques identifiés", analyst_label:"Analyste",
    pj_count:"Pièces jointes", decision_final:"Décision finale :", risk_global:"Niveau de risque global :",
    tab_summary:"Résumé", tab_questions:"Questions", tab_risks:"Risques",
    tab_showstoppers:"Showstoppers", tab_attachments:"Pièces jointes",
    see_all:"Voir tous →", see_all_f:"Voir toutes", overview_questions:"APERÇU DES QUESTIONS",
    risks_section:"RISQUES IDENTIFIÉS", pj_section:"PIÈCES JOINTES",
    pj_missing:"manquante", pj_missing_p:"manquantes", pj_complete:"Complètes ✓",
    pj_manage:"Gérer →", pj_required:"PJ requise", pj_done:"Document fourni — Score → 4/4",
    pj_waived:"Pas de PJ nécessaire — Score → 4/4", pj_ref:"PJ requise · réf.",
    pj_ref2:"Document lié à", pj_deposit:"Déposer le document", pj_no_need:"Pas besoin de PJ",
    pj_add:"Ajouter un autre fichier", pj_replace:"Remplacer", pj_add_doc:"Ajouter un document",
    pj_sending:"Envoi…", pj_processing:"En cours…",
    docs_required:"Documents requis par l'analyse", docs_optional:"Autres questions (optionnel)",
    pj_provided:"pièce jointe fournie", pj_provided_p:"pièces jointes fournies",
    pj_missing2:"document manquant", pj_missing2_p:"documents manquants", pj_all_ok:"— Toutes les pièces sont fournies ✓",
    description:"DESCRIPTION", recommendation:"RECOMMANDATION",
    vendor_response:"RÉPONSE FOURNISSEUR", justification:"JUSTIFICATION",
    block_reason:"RAISON DU BLOCAGE", followup:"QUESTION DE SUIVI",
    close:"Fermer", download_excel:"Télécharger Excel", download:"⬇ Excel",
    approve:"Approuver & Générer Excel", reject:"Rejeter", confirm_reject:"Confirmer le rejet",
    override_approve:"Passer outre & Approuver", comments:"Commentaires (optionnel)",
    comments_ph:"Ajoutez vos commentaires…", sending:"Envoi…",
    reject_banner:"L'analyse recommande le rejet de ce fournisseur",
    validate_banner:"Ce ticket nécessite une validation manuelle.",
    blocking:"problème bloquant", blocking_p:"problèmes bloquants",
    blocking_sub:"Ces points doivent être résolus avant toute approbation.",
    score_dist:"DISTRIBUTION DES SCORES",
    score_labels:["","Non-conforme","Partiel","Conforme","Mature"],
    // Tracking
    tracking_wait:"Traitement en cours, veuillez patienter…",
    tracking_sub:"Cette fenêtre se met à jour automatiquement toutes les 3 secondes.",
    connecting:"Connexion au serveur…", analysis_running:"Analyse en cours…",
    workflow_error:"Le workflow a rencontré une erreur.",
    auto_approved:"Analyse terminée — Approuvé", auto_approved_sub:"Le ticket a été validé automatiquement et ajouté à la liste.",
    auto_rejected:"Analyse terminée — Rejeté", report_loading:"Chargement du rapport…",
    no_result:"Aucun résultat disponible.",
    // Validate
    to_validate:"À valider", pending_p:"En attente",
    // Confirm delete
    delete_title:"Supprimer", delete_ticket:"ticket", delete_ticket_p:"tickets",
    delete_warn:"Cette action est irréversible.", delete_confirm:"Supprimer",
    // Upload
    upload_title:"Nouveau ticket TPRA",
  },
  en: {
    login_title:"Sign In", login_subtitle:"Access restricted to team members",
    login_profile:"YOUR PROFILE", login_admin:"Admin", login_admin_sub:"Full management",
    login_cyber:"Cyber Analyst", login_cyber_sub:"Analysis & validation",
    login_id:"USERNAME", login_id_ph:"user.name",
    login_pwd:"PASSWORD", login_pwd_ph:"••••••••",
    login_btn:"Sign in →", login_loading:"Signing in…",
    login_error:"Incorrect credentials.", login_footer:"Secure access · CMA CGM Cybersecurity",
    platform:"TPRA Platform", platform_sub:"THIRD PARTY RISK ASSESSMENT",
    role_admin:"ADMIN", role_cyber:"CYBER ANALYST",
    btn_refresh:"Refresh", btn_new:"New ticket", btn_logout:"Logout",
    btn_light:"Light mode", btn_dark:"Dark mode",
    greet:"Hello,", dashboard:"DASHBOARD",
    kpi_total:"Total tickets", kpi_running:"In progress", kpi_validate:"To validate",
    kpi_done:"Completed", kpi_rejected:"Rejected / Err.",
    kpi_one:"ticket", kpi_many:"tickets", kpi_none:"None",
    col_vendor:"Vendor", col_analyst:"Analyst / Approved by",
    col_decision:"Decision", col_status:"Status", col_date:"Date", col_actions:"Actions",
    btn_validate:"Validate", btn_excel:"Excel", btn_details:"Details",
    btn_delete:"Delete", btn_deselect:"Deselect", btn_cancel:"Cancel",
    selected:"selected", selected_p:"selected",
    validated_ai:"Approved by AI", validated_by:"Approved by",
    approved:"Approved", rejected:"Rejected",
    filter_all:"All", filter_pending:"Pending", filter_running:"In progress",
    filter_validate:"To validate", filter_done:"Completed", filter_rejected:"Rejected", filter_errors:"Errors",
    search_ph:"Search…", results:"result", results_p:"results", for:"for",
    no_tickets:"No tickets yet", no_results:"No results for",
    create_first:"Create first ticket", loading:"Loading…",
    new_ticket:"New TPRA Ticket", new_subtitle:"Launch a vendor risk analysis",
    vendor:"Vendor *", project:"Project", analyst:"Analyst",
    file:"File * (.xlsx, .pdf, .txt)", drop_file:"Drop file here or click to browse",
    cancel:"Cancel", launch:"Launch analysis", launching:"Launching…",
    field_required:"Vendor and file are required.",
    executive_summary:"EXECUTIVE SUMMARY", showstoppers:"SHOWSTOPPERS",
    workflow:"WORKFLOW PROGRESS", decision:"Decision", risk_level:"Risk level",
    global_score:"Global score", questions:"Questions",
    scores_low:"Scores ≤ 2", risks_found:"Identified risks", analyst_label:"Analyst",
    pj_count:"Attachments", decision_final:"Final decision:", risk_global:"Global risk level:",
    tab_summary:"Summary", tab_questions:"Questions", tab_risks:"Risks",
    tab_showstoppers:"Showstoppers", tab_attachments:"Attachments",
    see_all:"See all →", see_all_f:"See all", overview_questions:"QUESTIONS OVERVIEW",
    risks_section:"IDENTIFIED RISKS", pj_section:"ATTACHMENTS",
    pj_missing:"missing", pj_missing_p:"missing", pj_complete:"Complete ✓",
    pj_manage:"Manage →", pj_required:"Required", pj_done:"Document provided — Score → 4/4",
    pj_waived:"No attachment needed — Score → 4/4", pj_ref:"Required · ref.",
    pj_ref2:"Document linked to", pj_deposit:"Upload document", pj_no_need:"No attachment needed",
    pj_add:"Add another file", pj_replace:"Replace", pj_add_doc:"Add document",
    pj_sending:"Uploading…", pj_processing:"Processing…",
    docs_required:"Documents required by analysis", docs_optional:"Other questions (optional)",
    pj_provided:"attachment provided", pj_provided_p:"attachments provided",
    pj_missing2:"missing document", pj_missing2_p:"missing documents", pj_all_ok:"— All attachments provided ✓",
    description:"DESCRIPTION", recommendation:"RECOMMENDATION",
    vendor_response:"VENDOR RESPONSE", justification:"SCORE JUSTIFICATION",
    block_reason:"BLOCK REASON", followup:"FOLLOW-UP QUESTION",
    close:"Close", download_excel:"Download Excel", download:"⬇ Excel",
    approve:"Approve & Generate Excel", reject:"Reject", confirm_reject:"Confirm rejection",
    override_approve:"Override & Approve", comments:"Comments (optional)",
    comments_ph:"Add your comments…", sending:"Sending…",
    reject_banner:"Analysis recommends rejecting this vendor",
    validate_banner:"This ticket requires manual validation.",
    blocking:"blocking issue", blocking_p:"blocking issues",
    blocking_sub:"These issues must be resolved before any approval.",
    score_dist:"SCORE DISTRIBUTION",
    score_labels:["","Non-compliant","Partial","Compliant","Mature"],
    tracking_wait:"Processing, please wait…",
    tracking_sub:"This window updates automatically every 3 seconds.",
    connecting:"Connecting to server…", analysis_running:"Analysis in progress…",
    workflow_error:"The workflow encountered an error.",
    auto_approved:"Analysis complete — Approved", auto_approved_sub:"Ticket automatically validated and added to the list.",
    auto_rejected:"Analysis complete — Rejected", report_loading:"Loading report…",
    no_result:"No results available.",
    to_validate:"To validate", pending_p:"Pending",
    delete_title:"Delete", delete_ticket:"ticket", delete_ticket_p:"tickets",
    delete_warn:"This action is irreversible.", delete_confirm:"Delete",
    upload_title:"New TPRA Ticket",
  },
  es: {
    login_title:"Iniciar sesión", login_subtitle:"Acceso reservado a miembros del equipo",
    login_profile:"SU PERFIL", login_admin:"Admin", login_admin_sub:"Gestión completa",
    login_cyber:"Analista Cyber", login_cyber_sub:"Análisis y validación",
    login_id:"USUARIO", login_id_ph:"nombre.usuario",
    login_pwd:"CONTRASEÑA", login_pwd_ph:"••••••••",
    login_btn:"Iniciar sesión →", login_loading:"Iniciando…",
    login_error:"Credenciales incorrectas.", login_footer:"Acceso seguro · CMA CGM Ciberseguridad",
    platform:"TPRA Platform", platform_sub:"EVALUACIÓN DE RIESGO DE TERCEROS",
    role_admin:"ADMIN", role_cyber:"ANALISTA CYBER",
    btn_refresh:"Actualizar", btn_new:"Nuevo ticket", btn_logout:"Salir",
    btn_light:"Modo claro", btn_dark:"Modo oscuro",
    greet:"Hola,", dashboard:"PANEL DE CONTROL",
    kpi_total:"Total tickets", kpi_running:"En curso", kpi_validate:"Por validar",
    kpi_done:"Completados", kpi_rejected:"Rechazados / Err.",
    kpi_one:"ticket", kpi_many:"tickets", kpi_none:"Ninguno",
    col_vendor:"Proveedor", col_analyst:"Analista / Aprobado por",
    col_decision:"Decisión", col_status:"Estado", col_date:"Fecha", col_actions:"Acciones",
    btn_validate:"Validar", btn_excel:"Excel", btn_details:"Detalles",
    btn_delete:"Eliminar", btn_deselect:"Deseleccionar", btn_cancel:"Cancelar",
    selected:"seleccionado", selected_p:"seleccionados",
    validated_ai:"Aprobado por IA", validated_by:"Aprobado por",
    approved:"Aprobado", rejected:"Rechazado",
    filter_all:"Todos", filter_pending:"Pendiente", filter_running:"En curso",
    filter_validate:"Por validar", filter_done:"Completados", filter_rejected:"Rechazados", filter_errors:"Errores",
    search_ph:"Buscar…", results:"resultado", results_p:"resultados", for:"para",
    no_tickets:"Sin tickets por ahora", no_results:"Sin resultados para",
    create_first:"Crear el primer ticket", loading:"Cargando…",
    new_ticket:"Nuevo ticket TPRA", new_subtitle:"Lanzar un análisis de riesgo de proveedor",
    vendor:"Proveedor *", project:"Proyecto", analyst:"Analista",
    file:"Archivo * (.xlsx, .pdf, .txt)", drop_file:"Arrastre el archivo o haga clic",
    cancel:"Cancelar", launch:"Lanzar análisis", launching:"Lanzando…",
    field_required:"El proveedor y el archivo son obligatorios.",
    executive_summary:"RESUMEN EJECUTIVO", showstoppers:"BLOQUEANTES",
    workflow:"PROGRESO DEL FLUJO", decision:"Decisión", risk_level:"Nivel de riesgo",
    global_score:"Puntuación global", questions:"Preguntas",
    scores_low:"Puntuaciones ≤ 2", risks_found:"Riesgos identificados", analyst_label:"Analista",
    pj_count:"Adjuntos", decision_final:"Decisión final:", risk_global:"Nivel de riesgo global:",
    tab_summary:"Resumen", tab_questions:"Preguntas", tab_risks:"Riesgos",
    tab_showstoppers:"Bloqueantes", tab_attachments:"Adjuntos",
    see_all:"Ver todos →", see_all_f:"Ver todos", overview_questions:"VISTA GENERAL DE PREGUNTAS",
    risks_section:"RIESGOS IDENTIFICADOS", pj_section:"DOCUMENTOS ADJUNTOS",
    pj_missing:"faltante", pj_missing_p:"faltantes", pj_complete:"Completos ✓",
    pj_manage:"Gestionar →", pj_required:"Requerido", pj_done:"Documento aportado — Puntuación → 4/4",
    pj_waived:"Sin adjunto necesario — Puntuación → 4/4", pj_ref:"Requerido · ref.",
    pj_ref2:"Documento vinculado a", pj_deposit:"Subir documento", pj_no_need:"Sin adjunto necesario",
    pj_add:"Añadir otro archivo", pj_replace:"Reemplazar", pj_add_doc:"Añadir documento",
    pj_sending:"Enviando…", pj_processing:"Procesando…",
    docs_required:"Documentos requeridos por el análisis", docs_optional:"Otras preguntas (opcional)",
    pj_provided:"adjunto aportado", pj_provided_p:"adjuntos aportados",
    pj_missing2:"documento faltante", pj_missing2_p:"documentos faltantes", pj_all_ok:"— Todos los adjuntos aportados ✓",
    description:"DESCRIPCIÓN", recommendation:"RECOMENDACIÓN",
    vendor_response:"RESPUESTA DEL PROVEEDOR", justification:"JUSTIFICACIÓN",
    block_reason:"MOTIVO DEL BLOQUEO", followup:"PREGUNTA DE SEGUIMIENTO",
    close:"Cerrar", download_excel:"Descargar Excel", download:"⬇ Excel",
    approve:"Aprobar y generar Excel", reject:"Rechazar", confirm_reject:"Confirmar rechazo",
    override_approve:"Anular y aprobar", comments:"Comentarios (opcional)",
    comments_ph:"Añada sus comentarios…", sending:"Enviando…",
    reject_banner:"El análisis recomienda rechazar a este proveedor",
    validate_banner:"Este ticket requiere validación manual.",
    blocking:"problema bloqueante", blocking_p:"problemas bloqueantes",
    blocking_sub:"Estos puntos deben resolverse antes de cualquier aprobación.",
    score_dist:"DISTRIBUCIÓN DE PUNTUACIONES",
    score_labels:["","No conforme","Parcial","Conforme","Maduro"],
    tracking_wait:"Procesando, por favor espere…",
    tracking_sub:"Esta ventana se actualiza automáticamente cada 3 segundos.",
    connecting:"Conectando al servidor…", analysis_running:"Análisis en curso…",
    workflow_error:"El flujo de trabajo encontró un error.",
    auto_approved:"Análisis completado — Aprobado", auto_approved_sub:"Ticket validado automáticamente y añadido a la lista.",
    auto_rejected:"Análisis completado — Rechazado", report_loading:"Cargando informe…",
    no_result:"Sin resultados disponibles.",
    to_validate:"Por validar", pending_p:"Pendiente",
    delete_title:"Eliminar", delete_ticket:"ticket", delete_ticket_p:"tickets",
    delete_warn:"Esta acción es irreversible.", delete_confirm:"Eliminar",
    upload_title:"Nuevo ticket TPRA",
  },
  ar: {
    login_title:"تسجيل الدخول", login_subtitle:"الوصول مخصص لأعضاء الفريق",
    login_profile:"ملفك الشخصي", login_admin:"مدير", login_admin_sub:"الإدارة الكاملة",
    login_cyber:"محلل الأمن السيبراني", login_cyber_sub:"التحليل والتحقق",
    login_id:"اسم المستخدم", login_id_ph:"اسم.المستخدم",
    login_pwd:"كلمة المرور", login_pwd_ph:"••••••••",
    login_btn:"تسجيل الدخول ←", login_loading:"جارٍ التسجيل…",
    login_error:"بيانات الاعتماد غير صحيحة.", login_footer:"وصول آمن · CMA CGM للأمن السيبراني",
    platform:"منصة TPRA", platform_sub:"تقييم مخاطر الطرف الثالث",
    role_admin:"مدير", role_cyber:"محلل سيبراني",
    btn_refresh:"تحديث", btn_new:"تذكرة جديدة", btn_logout:"خروج",
    btn_light:"الوضع الفاتح", btn_dark:"الوضع الداكن",
    greet:"مرحباً،", dashboard:"لوحة التحكم",
    kpi_total:"إجمالي التذاكر", kpi_running:"قيد المعالجة", kpi_validate:"للتحقق",
    kpi_done:"مكتملة", kpi_rejected:"مرفوضة / خطأ",
    kpi_one:"تذكرة", kpi_many:"تذاكر", kpi_none:"لا شيء",
    col_vendor:"المورد", col_analyst:"المحلل / المعتمد من",
    col_decision:"القرار", col_status:"الحالة", col_date:"التاريخ", col_actions:"الإجراءات",
    btn_validate:"تحقق", btn_excel:"Excel", btn_details:"التفاصيل",
    btn_delete:"حذف", btn_deselect:"إلغاء التحديد", btn_cancel:"إلغاء",
    selected:"محدد", selected_p:"محددة",
    validated_ai:"معتمد بواسطة الذكاء الاصطناعي", validated_by:"معتمد من",
    approved:"معتمد", rejected:"مرفوض",
    filter_all:"الكل", filter_pending:"قيد الانتظار", filter_running:"قيد المعالجة",
    filter_validate:"للتحقق", filter_done:"مكتملة", filter_rejected:"مرفوضة", filter_errors:"أخطاء",
    search_ph:"بحث…", results:"نتيجة", results_p:"نتائج", for:"لـ",
    no_tickets:"لا توجد تذاكر حتى الآن", no_results:"لا توجد نتائج لـ",
    create_first:"إنشاء أول تذكرة", loading:"جارٍ التحميل…",
    new_ticket:"تذكرة TPRA جديدة", new_subtitle:"إطلاق تحليل مخاطر المورد",
    vendor:"المورد *", project:"المشروع", analyst:"المحلل",
    file:"ملف * (.xlsx, .pdf, .txt)", drop_file:"اسحب الملف أو انقر للاستعراض",
    cancel:"إلغاء", launch:"إطلاق التحليل", launching:"جارٍ الإطلاق…",
    field_required:"المورد والملف مطلوبان.",
    executive_summary:"الملخص التنفيذي", showstoppers:"عوامل الإيقاف",
    workflow:"تقدم سير العمل", decision:"القرار", risk_level:"مستوى المخاطرة",
    global_score:"النتيجة الإجمالية", questions:"الأسئلة",
    scores_low:"نتائج ≤ 2", risks_found:"المخاطر المحددة", analyst_label:"المحلل",
    pj_count:"المرفقات", decision_final:"القرار النهائي:", risk_global:"مستوى المخاطرة العالمي:",
    tab_summary:"الملخص", tab_questions:"الأسئلة", tab_risks:"المخاطر",
    tab_showstoppers:"عوامل الإيقاف", tab_attachments:"المرفقات",
    see_all:"عرض الكل ←", see_all_f:"عرض الكل", overview_questions:"نظرة عامة على الأسئلة",
    risks_section:"المخاطر المحددة", pj_section:"المرفقات المطلوبة",
    pj_missing:"مفقود", pj_missing_p:"مفقودة", pj_complete:"مكتملة ✓",
    pj_manage:"إدارة ←", pj_required:"مطلوب", pj_done:"تم تقديم الوثيقة — النتيجة → 4/4",
    pj_waived:"لا حاجة لمرفق — النتيجة → 4/4", pj_ref:"مطلوب · مرجع.",
    pj_ref2:"وثيقة مرتبطة بـ", pj_deposit:"رفع الوثيقة", pj_no_need:"لا حاجة لمرفق",
    pj_add:"إضافة ملف آخر", pj_replace:"استبدال", pj_add_doc:"إضافة وثيقة",
    pj_sending:"جارٍ الإرسال…", pj_processing:"جارٍ المعالجة…",
    docs_required:"الوثائق المطلوبة بالتحليل", docs_optional:"أسئلة أخرى (اختياري)",
    pj_provided:"مرفق مقدم", pj_provided_p:"مرفقات مقدمة",
    pj_missing2:"وثيقة مفقودة", pj_missing2_p:"وثائق مفقودة", pj_all_ok:"— جميع المرفقات مقدمة ✓",
    description:"الوصف", recommendation:"التوصية",
    vendor_response:"رد المورد", justification:"تبرير النتيجة",
    block_reason:"سبب الحجب", followup:"سؤال المتابعة",
    close:"إغلاق", download_excel:"تنزيل Excel", download:"⬇ Excel",
    approve:"اعتماد وإنشاء Excel", reject:"رفض", confirm_reject:"تأكيد الرفض",
    override_approve:"تجاوز والاعتماد", comments:"تعليقات (اختياري)",
    comments_ph:"أضف تعليقاتك…", sending:"جارٍ الإرسال…",
    reject_banner:"يوصي التحليل برفض هذا المورد",
    validate_banner:"تتطلب هذه التذكرة تحققاً يدوياً.",
    blocking:"مشكلة حاجبة", blocking_p:"مشاكل حاجبة",
    blocking_sub:"يجب حل هذه النقاط قبل أي اعتماد.",
    score_dist:"توزيع النتائج",
    score_labels:["","غير مطابق","جزئي","مطابق","ناضج"],
    tracking_wait:"جارٍ المعالجة، يرجى الانتظار…",
    tracking_sub:"تتحدث هذه النافذة تلقائياً كل 3 ثوانٍ.",
    connecting:"جارٍ الاتصال بالخادم…", analysis_running:"التحليل جارٍ…",
    workflow_error:"واجه سير العمل خطأً.",
    auto_approved:"اكتمل التحليل — معتمد", auto_approved_sub:"تمت الموافقة التلقائية على التذكرة وإضافتها للقائمة.",
    auto_rejected:"اكتمل التحليل — مرفوض", report_loading:"جارٍ تحميل التقرير…",
    no_result:"لا توجد نتائج متاحة.",
    to_validate:"للتحقق", pending_p:"قيد الانتظار",
    delete_title:"حذف", delete_ticket:"تذكرة", delete_ticket_p:"تذاكر",
    delete_warn:"هذا الإجراء لا رجعة فيه.", delete_confirm:"حذف",
    upload_title:"تذكرة TPRA جديدة",
  },
};

// Hook
function useLang() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("tpra_lang") || "fr";
  });
  function changeLang(l) {
    localStorage.setItem("tpra_lang", l);
    setLang(l);
    document.documentElement.dir = LANGS[l].rtl ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }
  useEffect(() => {
    document.documentElement.dir = LANGS[lang].rtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);
  return [T_ALL[lang], lang, changeLang, LANGS[lang].rtl];
}

// Lang selector component
function LangSelector({ lang, changeLang, dark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:8,
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(18,33,75,0.06)",
          border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(18,33,75,0.15)",
          color: dark ? "rgba(255,255,255,0.8)" : "#12214B",
          cursor:"pointer", fontSize:12, fontWeight:600 }}>
        <span>{LANGS[lang].flag}</span>
        <span>{LANGS[lang].label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:500,
          background: dark ? "#0d1e3a" : "#fff",
          border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
          borderRadius:10, overflow:"hidden", minWidth:150,
          boxShadow:"0 8px 24px rgba(0,0,0,0.15)" }}>
          {Object.entries(LANGS).map(([code, info]) => (
            <button key={code} onClick={() => { changeLang(code); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"9px 14px", background: lang===code ? (dark?"rgba(227,6,19,0.1)":"rgba(227,6,19,0.06)") : "transparent",
                border:"none", cursor:"pointer", fontSize:13,
                color: lang===code ? "#E30613" : (dark?"rgba(255,255,255,0.75)":"#374151"),
                fontWeight: lang===code ? 700 : 400,
                textAlign: info.rtl ? "right" : "left",
                direction: info.rtl ? "rtl" : "ltr" }}>
              <span style={{ fontSize:16 }}>{info.flag}</span>
              <span>{info.label}</span>
              {lang===code && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="3" strokeLinecap="round" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cyber Network Background ──────────────────────────────────────────────────
function CyberBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    // ── Nodes ──
    const NODE_COUNT = 55;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.45,
      vy:   (Math.random() - 0.5) * 0.45,
      r:    Math.random() * 2.5 + 1.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      type: Math.random() > 0.82 ? "hub" : "node",
    }));

    // ── Data packets flying along edges ──
    const packets = [];
    function spawnPacket(a, b) {
      packets.push({ a, b, t: 0, speed: Math.random() * 0.008 + 0.004 });
    }
    // Pre-spawn some
    for (let i = 0; i < 18; i++) {
      const a = Math.floor(Math.random() * NODE_COUNT);
      const b = Math.floor(Math.random() * NODE_COUNT);
      if (a !== b) spawnPacket(a, b);
    }

    const CONNECT_DIST = 160;
    const HUB_DIST     = 220;

    let t = 0;
    function draw() {
      t++;
      ctx.clearRect(0, 0, W, H);

      // ── Grid ──
      ctx.strokeStyle = "rgba(58,95,191,0.08)";
      ctx.lineWidth   = 0.5;
      const GRID = 60;
      for (let x = 0; x < W; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── Move nodes ──
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }

      // ── Edges ──
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const maxD = (a.type === "hub" || b.type === "hub") ? HUB_DIST : CONNECT_DIST;
          if (dist < maxD) {
            const alpha = (1 - dist / maxD) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(58,95,191,${alpha})`;
            ctx.lineWidth = a.type === "hub" || b.type === "hub" ? 0.9 : 0.5;
            ctx.stroke();
          }
        }
      }

      // ── Packets ──
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        const a = nodes[p.a], b = nodes[p.b];
        p.t += p.speed;
        if (p.t >= 1) { packets.splice(i, 1); continue; }
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        // glow trail
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grad.addColorStop(0,   "rgba(227,6,19,0.9)");
        grad.addColorStop(0.4, "rgba(227,6,19,0.3)");
        grad.addColorStop(1,   "rgba(227,6,19,0)");
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // core dot
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ff3a4a";
        ctx.fill();
      }

      // Spawn new packets periodically
      if (t % 45 === 0) {
        const a = Math.floor(Math.random() * NODE_COUNT);
        const b = Math.floor(Math.random() * NODE_COUNT);
        if (a !== b) spawnPacket(a, b);
      }

      // ── Nodes ──
      for (const n of nodes) {
        const pulseFactor = 0.5 + 0.5 * Math.sin(n.pulse);
        if (n.type === "hub") {
          // outer ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 4 * pulseFactor + 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(58,95,191,${0.25 * pulseFactor})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
          // mid ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(58,95,191,0.5)";
          ctx.lineWidth   = 0.8;
          ctx.stroke();
          // core
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
          g.addColorStop(0, "rgba(120,160,255,0.95)");
          g.addColorStop(1, "rgba(58,95,191,0)");
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        } else {
          const g2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.5);
          g2.addColorStop(0, `rgba(90,130,230,${0.7 + 0.3 * pulseFactor})`);
          g2.addColorStop(1, "rgba(58,95,191,0)");
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = g2;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150,190,255,${0.8 + 0.2 * pulseFactor})`;
          ctx.fill();
        }
      }

      // ── Corner accent lines ──
      const lineAlpha = 0.15 + 0.05 * Math.sin(t * 0.02);
      ctx.strokeStyle = `rgba(227,6,19,${lineAlpha})`;
      ctx.lineWidth   = 1;
      [[0,0,120,0],[0,0,0,80],[W,0,W-120,0],[W,0,W,80],
       [0,H,120,H],[0,H,0,H-80],[W,H,W-120,H],[W,H,W,H-80]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      for (const n of nodes) { n.x = Math.random()*W; n.y = Math.random()*H; }
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0, zIndex: 0,
      width: "100%", height: "100%",
    }} />
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, tr, lang, changeLang, isRtl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError(tr.login_error);
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1428 0%, #0e1e3e 40%, #091630 70%, #0a1428 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <CyberBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gridMove {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }

        .login-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: #FAFBFC;
          color: #12214B;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .login-input:focus {
          border-color: #12214B;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(18,33,75,0.10);
        }
        .login-input::placeholder { color: #A0AEC0; }

        .login-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: #12214B;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: 0.02em;
        }
        .login-btn:hover:not(:disabled) {
          background: #1a3068;
          box-shadow: 0 4px 14px rgba(18,33,75,0.30);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.7; cursor: wait; }

        .role-card {
          flex: 1;
          padding: 14px 12px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: #FAFBFC;
          cursor: pointer;
          transition: all 0.18s;
          text-align: center;
        }
        .role-card:hover { border-color: #8FA3CC; background: #EEF1F8; }
        .role-card.active {
          border-color: #12214B;
          background: #EEF1F8;
          box-shadow: 0 0 0 3px rgba(18,33,75,0.10);
        }
      `}</style>





      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: 420,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>

        {/* Logo block */}
        <div style={{ textAlign:"center", marginBottom:32, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <img src={CMA_CGM_LOGO} alt="CMA CGM" style={{ height:120, objectFit:"contain", filter:"brightness(0) invert(1)", display:"block", margin:"0 auto 22px auto" }} />
          <div style={{ fontWeight:700, fontSize:22, color:"#ffffff", letterSpacing:"-0.02em", textAlign:"center" }}>TPRA Platform</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, marginTop:4, fontWeight:400, textAlign:"center", letterSpacing:"0.06em" }}>THIRD PARTY RISK ASSESSMENT</div>
        </div>

        {/* Lang selector */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
          <LangSelector lang={lang} changeLang={changeLang} dark={true} />
        </div>

        {/* Form card */}
        <div style={{
          background: "#fff",
          borderRadius: 18,
          padding: "32px 32px 28px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.08)",
          border: "1px solid #E2E8F0",
        }}>
          <div style={{ fontWeight:600, fontSize:16, color:"#12214B", marginBottom:4 }}>Connexion</div>
          <div style={{ color:"#94A3B8", fontSize:12, marginBottom:24 }}>Accès réservé aux membres de l'équipe</div>

          {/* Role selector */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#64748B", letterSpacing:"0.07em", marginBottom:8 }}>VOTRE PROFIL</div>
            <div style={{ display:"flex", gap:8 }}>
              <div className="role-card" style={{ borderColor: username==="admin" ? "#12214B":"#E2E8F0", background: username==="admin"?"#EEF1F8":"#FAFBFC" }}
                onClick={()=>{ setUsername("admin"); setPassword(""); }}>
                <div style={{ marginBottom:6 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/></svg></div>
                <div style={{ fontSize:12, fontWeight:600, color:"#12214B" }}>Admin</div>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>Gestion complète</div>
              </div>
              <div className="role-card" style={{ borderColor: username&&username!=="admin" ? "#12214B":"#E2E8F0", background: username&&username!=="admin"?"#EEF1F8":"#FAFBFC" }}
                onClick={()=>{ setUsername("cyber1"); setPassword(""); }}>
                <div style={{ marginBottom:6 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                <div style={{ fontSize:12, fontWeight:600, color:"#12214B" }}>Analyste Cyber</div>
                <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>Analyse & validation</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#64748B", letterSpacing:"0.07em", marginBottom:6 }}>IDENTIFIANT</label>
              <input
                className="login-input"
                value={username}
                onChange={e=>{ setUsername(e.target.value); setError(""); }}
                placeholder={tr.login_id_ph}
                autoComplete="username"
                required
              />
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#64748B", letterSpacing:"0.07em" }}>MOT DE PASSE</label>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  className="login-input"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e=>{ setPassword(e.target.value); setError(""); }}
                  placeholder={tr.login_pwd_ph}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight:42 }}
                />
                <button type="button" onClick={()=>setShowPwd(v=>!v)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#94A3B8", cursor:"pointer", fontSize:16, lineHeight:1, padding:0 }}>
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background:"#FFF0F0", border:"1px solid #FFBCBF", borderRadius:8,
                padding:"9px 12px", color:"#E30613", fontSize:12,
                marginBottom:16, display:"flex", alignItems:"center", gap:7,
              }}>
                <span style={{ flexShrink:0 }}>⚠</span> {error}
              </div>
            )}

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <span style={{ display:"inline-flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                  <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                  Connexion…
                </span>
              ) : "Se connecter →"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:20, color:"rgba(255,255,255,0.55)", fontSize:11, letterSpacing:"0.04em" }}>
          Accès sécurisé · CMA CGM Cybersécurité
        </div>
      </div>
    </div>
  );
}



function getStatus(tr) { return {
  pending:             { label: tr?.filter_pending||"En attente",  color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  running:             { label: tr?.kpi_running||"En cours",       color: "#3A5FBF", bg: "#EEF1F8", dot: "#3A5FBF" },
  waiting_validation:  { label: tr?.filter_validate||"À valider",  color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  completed:           { label: "Terminé",                         color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  rejected:            { label: tr?.rejected||"Rejeté",            color: "#E30613", bg: "#FFF0F0", dot: "#E8404C" },
  error:               { label: "Erreur",                          color: "#E30613", bg: "#FFF0F0", dot: "#E8404C" },
};}
// Default STATUS for components without tr
const STATUS = getStatus(null);

const RISK_COLORS  = { Critical: "#E30613", High: "#EA580C", Medium: "#D97706", Low: "#16A34A" };
const SCORE_COLORS = { 1: "#E30613", 2: "#EA580C", 3: "#D97706", 4: "#16A34A" };
const SCORE_BG     = { 1: "#FFF0F0", 2: "#FFF7ED", 3: "#FFFBEB", 4: "#F0FDF4" };
const SCORE_LABELS = { 1: "Non-conforme", 2: "Partiel", 3: "Conforme", 4: "Mature" };

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}
function fmtDuration(ms) {
  if (ms == null) return null;
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`;
}

function StatusBadge({ status, tr:trProp }) {
  const statusMap = trProp ? getStatus(trProp) : STATUS;
  const s = statusMap[status] || statusMap.pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
      background:`${s.color}18`, color:s.color, fontSize:11, fontWeight:600, border:`1px solid ${s.color}44` }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0,
        animation: status==="running" ? "blink 1.4s infinite" : "none",
        boxShadow: status==="running" ? `0 0 6px ${s.dot}` : "none" }} />
      {s.label}
    </span>
  );
}

function ScorePill({ score }) {
  if (!score) return null;
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, background: SCORE_BG[score], color: SCORE_COLORS[score], fontSize: 11, fontWeight: 600, border: `1px solid ${SCORE_COLORS[score]}33` }}>
      {score}/4 · {SCORE_LABELS[score]}
    </span>
  );
}

function WorkflowTimeline({ ticket }) {
  const steps = ticket.workflow_steps || deriveSteps(ticket.status);
  function deriveSteps(status) {
    const order = ["extract_text","analyze_risks","score_responses","generate_text_report","export_excel"];
    const doneCount = { running:1, waiting_validation:3, completed:5, rejected:3, error:1 }[status] ?? 0;
    return order.map((key,i) => ({
      key,
      status: i < doneCount ? "done" : i === doneCount && ["running","error"].includes(status) ? (status === "error" ? "error" : "running") : "pending",
      duration_ms: null,
    }));
  }
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, overflowX: "auto" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 12 }}>PROGRESSION DU WORKFLOW</div>
      <div style={{ display: "flex", alignItems: "center", minWidth: "max-content" }}>
        {steps.map((step, i) => {
          const isDone=step.status==="done", isRun=step.status==="running", isErr=step.status==="error";
          const color  = isDone?"#059669":isRun?"#12214B":isErr?"#E30613":"#D1D5DB";
          const bgC    = isDone?"#ECFDF5":isRun?"#EEF1F8":isErr?"#FFF0F0":"#F3F4F6";
          const bdr    = isDone?"#A7F3D0":isRun?"#B8C3DE":isErr?"#FFBCBF":"#E5E7EB";
          return (
            <div key={step.key} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, background:bgC, border:`1px solid ${bdr}`, color, minWidth:115 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0, animation:isRun?"blink 1.4s infinite":"none" }} />
                <div>
                  <div style={{ fontSize:10, fontWeight:700, whiteSpace:"nowrap", fontFamily:"monospace" }}>{step.key}</div>
                  {step.duration_ms!=null && <div style={{ fontSize:9, color:"#9CA3AF", marginTop:1 }}>{fmtDuration(step.duration_ms)}</div>}
                  {isRun && <div style={{ fontSize:9, color:"#12214B", marginTop:1 }}>en cours…</div>}
                </div>
                {isDone && <span style={{ marginLeft:"auto", color:"#059669", fontSize:11, flexShrink:0 }}>✓</span>}
                {isErr  && <span style={{ marginLeft:"auto", color:"#E30613", fontSize:11, flexShrink:0 }}>✗</span>}
              </div>
              {i < steps.length-1 && (
                <div style={{ width:20, height:1, background:isDone?"#A7F3D0":"#E5E7EB", flexShrink:0, position:"relative" }}>
                  <span style={{ position:"absolute", right:-4, top:-5, color:isDone?"#10B98188":"#D1D5DB", fontSize:10 }}>›</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionList({ questions }) {
  const [search, setSearch]           = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [expanded, setExpanded]       = useState(null);
  const filtered = questions.filter(q => {
    const ok1 = !search || q.question?.toLowerCase().includes(search.toLowerCase()) || q.question_id?.toLowerCase().includes(search.toLowerCase());
    const ok2 = scoreFilter==="all" || String(q.score)===scoreFilter;
    return ok1 && ok2;
  });
  const counts = questions.reduce((acc,q) => { acc[q.score]=(acc[q.score]||0)+1; return acc; }, {});
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.08em" }}>QUESTIONS TRAITÉES ({questions.length})</span>
        <div style={{ display:"flex", gap:4 }}>
          {["all","1","2","3","4"].map(s => {
            const active=scoreFilter===s;
            const col=s==="all"?"#12214B":SCORE_COLORS[+s];
            return (
              <button key={s} onClick={() => setScoreFilter(active&&s!=="all"?"all":s)}
                style={{ padding:"2px 7px", borderRadius:10, fontSize:10, fontWeight:600, cursor:"pointer", background:active?(s==="all"?"#F3F4F6":SCORE_BG[+s]):"transparent", border:active?`1px solid ${col}33`:"1px solid transparent", color:active?col:"#9CA3AF" }}>
                {s==="all"?"Tous":`${s}/4`}{s!=="all"&&counts[+s]?` (${counts[+s]})`:""}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ position:"relative", marginBottom:8 }}>
        <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", pointerEvents:"none", display:"flex" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une question…"
          style={{ width:"100%", padding:"7px 10px 7px 26px", borderRadius:6, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#0F172A", fontSize:12, outline:"none", boxSizing:"border-box" }} />
      </div>
      <div style={{ border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
        {filtered.length===0
          ? <div style={{ padding:20, textAlign:"center", color:"#9CA3AF", fontSize:12 }}>Aucune question correspondante</div>
          : filtered.map((q,idx) => {
              const col=SCORE_COLORS[q.score]||"#9CA3AF";
              const isEx=expanded===q.question_id;
              return (
                <div key={q.question_id} onClick={() => setExpanded(isEx?null:q.question_id)}
                  style={{ borderBottom:idx<filtered.length-1?"1px solid #F3F4F6":"none", cursor:"pointer", background:isEx?"#FAFAFA":"#fff" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px" }}>
                    <div style={{ width:3, height:34, borderRadius:2, background:col, flexShrink:0, marginTop:2 }} />
                    <span style={{ background:SCORE_BG[q.score]||"#F3F4F6", color:col, fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${col}22`, marginTop:1 }}>{q.question_id}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#0F172A", fontSize:12, lineHeight:1.5, overflow:isEx?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:isEx?"normal":"nowrap" }}>{q.question}</div>
                      {isEx && (
                        <div style={{ marginTop:8 }}>
                          {q.response && (
                            <div style={{ marginBottom:6 }}>
                              <div style={{ fontSize:10, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.06em", marginBottom:2 }}>RÉPONSE FOURNISSEUR</div>
                              <div style={{ color:"#2D3748", fontSize:11, lineHeight:1.6, borderLeft:`2px solid ${col}44`, paddingLeft:8 }}>{q.response}</div>
                            </div>
                          )}
                          {q.justification && (
                            <div style={{ marginBottom:6 }}>
                              <div style={{ fontSize:10, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.06em", marginBottom:2 }}>JUSTIFICATION</div>
                              <div style={{ color:"#6B7280", fontSize:11, lineHeight:1.6, borderLeft:`2px solid ${col}44`, paddingLeft:8 }}>{q.justification}</div>
                            </div>
                          )}
                          {q.follow_up_question && (
                            <div style={{ background:"#EEF1F8", borderRadius:5, padding:"5px 8px", border:"1px solid #B8C3DE" }}>
                              <span style={{ fontSize:10, fontWeight:600, color:"#0E1A3A" }}>❓ </span>
                              <span style={{ fontSize:11, color:"#0E1A3A" }}>{q.follow_up_question}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, marginTop:1 }}>
                      <ScorePill score={q.score} />
                      {q.is_showstopper&&<span style={{ color:"#E30613", fontSize:11 }}>⊘</span>}
                      <span style={{ color:"#9CA3AF", fontSize:10, transform:isEx?"rotate(180deg)":"none", display:"inline-block", transition:"transform 0.2s" }}>▾</span>
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>
      {questions.length>0&&(
        <div style={{ marginTop:8, display:"flex", gap:12, flexWrap:"wrap" }}>
          {[4,3,2,1].filter(s=>counts[s]).map(s=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:SCORE_COLORS[s] }} />
              <span style={{ color:"#6B7280", fontSize:11 }}>{counts[s]} {SCORE_LABELS[s]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Live Tracking Modal ───────────────────────────────────────────────────────
// Phases:
//   "tracking"   — ticket is running, we poll every 3s and show live timeline
//   "validate"   — ticket reached waiting_validation → show results + Approve/Reject
//   "done"       — completed (auto-approved) or rejected → show summary, close button
function LiveTrackingModal({ ticketId, onClose, onRefreshList }) {
  const [ticket, setTicket]   = useState(null);
  const [phase, setPhase]     = useState("tracking");
  const [comments, setComments] = useState("");
  const [sending, setSending]   = useState(false);
  const [tab, setTab]           = useState("overview");
  const intervalRef             = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/tickets/${ticketId}`);
      const data = await res.json();
      setTicket(data);
      if (data.status === "waiting_validation") {
        setPhase("validate");
        clearInterval(intervalRef.current);
      } else if (data.status === "completed" && data.result?.final_decision === "Rejected") {
        setPhase("validate");
        clearInterval(intervalRef.current);
      } else if (data.status === "completed" || data.status === "rejected" || data.status === "error") {
        setPhase("done");
        clearInterval(intervalRef.current);
        onRefreshList();
      }
    } catch (e) { console.error(e); }
  }, [ticketId, onRefreshList]);

  useEffect(() => {
    fetchTicket();
    intervalRef.current = setInterval(fetchTicket, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fetchTicket]);

  async function sendValidation(approved) {
    setSending(true);
    await fetch(`${API}/tickets/${ticket.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, comments, validated_by: ticket?.analyst || "Analyste" }),
    });
    setSending(false);
    onRefreshList();
    onClose();
  }

  const result      = ticket?.result || {};
  const hasQuestions = result.question_scores?.length > 0;

  // ── Pièces jointes ──────────────────────────────────────────────────────────
  const [attachments, setAttachments] = useState({});
  const [, setUploading]              = useState({});
  const [pjActions,   setPjActions]   = useState({});
  const [pjLoading,   setPjLoading]   = useState({});

  const fetchAttachments = useCallback(async () => {
    if (!ticket?.id) return;
    try {
      const res  = await fetch(`${API}/tickets/${ticket.id}/attachments`);
      const list = await res.json();
      const grouped = list.reduce((acc, a) => {
        if (!acc[a.question_id]) acc[a.question_id] = [];
        acc[a.question_id].push(a);
        return acc;
      }, {});
      setAttachments(grouped);
    } catch(e) { console.error(e); }
  }, [ticket?.id]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  async function uploadFile(questionId, file) {
    setUploading(u => ({ ...u, [questionId]: true }));
    const fd = new FormData();
    fd.append("question_id", questionId);
    fd.append("file", file);
    try {
      await fetch(`${API}/tickets/${ticket.id}/attachments`, { method:"POST", body:fd });
      await fetchAttachments();
    } catch(e) { console.error(e); }
    setUploading(u => ({ ...u, [questionId]: false }));
  }

  async function deleteAttachment(attId) {
    try {
      await fetch(`${API}/tickets/${ticket.id}/attachments/${attId}`, { method:"DELETE" });
      await fetchAttachments();
    } catch(e) { console.error(e); }
  }

  async function resolvePJ(questionId, action) {
    setPjLoading(l => ({ ...l, [questionId]: action }));
    try {
      const res  = await fetch(`${API}/tickets/${ticket.id}/piece-jointe`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ question_id: questionId, action }),
      });
      const data = await res.json();
      setPjActions(a => ({ ...a, [questionId]: action }));
      setTicket(t => {
        const r  = t.result || t;
        const qs = (r.question_scores||[]).map(q =>
          q.question_id === questionId ? { ...q, score: data.new_score, pj_action: action } : q
        );
        const nr = { ...r, question_scores: qs, global_score: data.global_score };
        return t.result ? { ...t, result: nr } : nr;
      });
    } catch(e) { console.error(e); }
    setPjLoading(l => ({ ...l, [questionId]: null }));
  }

  async function uploadFileAndResolve(questionId, file) {
    setUploading(u => ({ ...u, [questionId]: true }));
    const fd = new FormData();
    fd.append("question_id", questionId);
    fd.append("file", file);
    try {
      await fetch(`${API}/tickets/${ticket.id}/attachments`, { method:"POST", body:fd });
      await fetchAttachments();
      if (!pjActions[questionId]) await resolvePJ(questionId, "uploaded");
    } catch(e) { console.error(e); }
    setUploading(u => ({ ...u, [questionId]: false }));
  }

  // ── PJ row component (reusable inline) ──────────────────────────────────────
  function PJRow({ q }) {
    const action  = pjActions[q.question_id] || q.pj_action;
    const loading = pjLoading[q.question_id];
    const resolved = !!action;
    const isUpload = action === "uploaded";
    const isWaived = action === "not_needed";
    const qAtts    = attachments[q.question_id] || [];

    return (
      <div style={{ margin:"0 0 2px 0", padding:"10px 12px", borderRadius:8,
        background: isUpload?"rgba(52,211,153,0.05)":isWaived?"rgba(58,95,191,0.05)":"rgba(18,33,75,0.04)",
        border:     isUpload?"1px solid rgba(52,211,153,0.18)":isWaived?"1px solid rgba(58,95,191,0.18)":"1px dashed rgba(18,33,75,0.22)" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom: resolved&&!qAtts.length?0:8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke={isUpload?"#34D399":isWaived?"#3A5FBF":"#12214B"}
            strokeWidth="2.5" strokeLinecap="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
          <span style={{ fontSize:10, fontWeight:700, flex:1,
            color: isUpload?"#34D399":isWaived?"#3A5FBF":"#12214B" }}>
            {isUpload ? "Document fourni — Score → 4/4" : isWaived ? "Pas de PJ nécessaire — Score → 4/4" : `PJ requise · réf. ${q.piece_jointe}`}
          </span>
          {resolved && (
            <span style={{ padding:"1px 7px", borderRadius:20, fontSize:9, fontWeight:800,
              background: isUpload?"rgba(52,211,153,0.1)":"rgba(58,95,191,0.1)",
              color:      isUpload?"#34D399":"#3A5FBF",
              border:     isUpload?"1px solid rgba(52,211,153,0.2)":"1px solid rgba(58,95,191,0.2)" }}>
              4/4 · Mature
            </span>
          )}
        </div>

        {/* Files */}
        {qAtts.map(att => (
          <div key={att.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 8px", borderRadius:6, marginBottom:5,
            background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.18)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <span style={{ flex:1, fontSize:10, color:"#34D399", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{att.filename}</span>
            <button onClick={()=>window.open(`${API}/tickets/${ticket.id}/attachments/${att.id}/download`,"_blank")}
              style={{ background:"none", border:"none", color:"#34D399", cursor:"pointer", padding:2, display:"flex" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button onClick={()=>deleteAttachment(att.id)}
              style={{ background:"none", border:"none", color:"#E30613", cursor:"pointer", padding:2, display:"flex" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        ))}

        {/* Action buttons */}
        {!resolved && (
          <div style={{ display:"flex", gap:8, marginTop: qAtts.length>0?6:0 }}>
            <label style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"7px 0", borderRadius:7, cursor:"pointer",
              background:"rgba(18,33,75,0.06)", border:"1px solid rgba(18,33,75,0.2)", color:"#12214B", fontSize:11, fontWeight:700 }}>
              {loading==="uploaded"
                ? <><span style={{ width:6, height:6, borderRadius:"50%", background:"#12214B", display:"inline-block", animation:"blink 1.4s infinite" }} /> Envoi…</>
                : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Déposer le document</>}
              <input type="file" style={{ display:"none" }} disabled={!!loading}
                onChange={e=>{ if(e.target.files[0]) uploadFileAndResolve(q.question_id, e.target.files[0]); e.target.value=""; }} />
            </label>
            <button onClick={()=>resolvePJ(q.question_id,"not_needed")} disabled={!!loading}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"7px 0", borderRadius:7, cursor:"pointer",
                background:"rgba(58,95,191,0.07)", border:"1px solid rgba(58,95,191,0.2)", color:"#3A5FBF", fontSize:11, fontWeight:700 }}>
              {loading==="not_needed"
                ? <><span style={{ width:6, height:6, borderRadius:"50%", background:"#3A5FBF", display:"inline-block", animation:"blink 1.4s infinite" }} /> En cours…</>
                : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Pas besoin de PJ</>}
            </button>
          </div>
        )}
        {resolved && !isWaived && (
          <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, cursor:"pointer", marginTop:4,
            background:"transparent", border:"1px solid rgba(52,211,153,0.2)", color:"#34D399", fontSize:10, fontWeight:600 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter un autre fichier
            <input type="file" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]) uploadFile(q.question_id, e.target.files[0]); e.target.value=""; }} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:720, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.1)", border:"1px solid #E5E7EB" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:"#0F172A" }}>
              {ticket ? ticket.vendor : "Chargement…"}
            </div>
            {ticket && (
              <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4 }}>
                {ticket.project && <span style={{ color:"#9CA3AF", fontSize:12 }}>{ticket.project}</span>}
                {ticket.analyst && <span style={{ color:"#9CA3AF", fontSize:12 }}>· {ticket.analyst}</span>}
                <StatusBadge status={ticket.status} />
              </div>
            )}
          </div>
          {phase !== "tracking" && (
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:18, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
        </div>

        {/* ── Phase: TRACKING ── */}
        {phase === "tracking" && ticket && (
          <>
            <WorkflowTimeline ticket={ticket} />
            <div style={{ textAlign:"center", padding:"32px 0 16px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, color:"#12214B", fontSize:13, fontWeight:500 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#3A5FBF", display:"inline-block", animation:"blink 1.4s infinite" }} />
                Traitement en cours, veuillez patienter…
              </div>
              <div style={{ color:"#9CA3AF", fontSize:12, marginTop:8 }}>Cette fenêtre se met à jour automatiquement toutes les 3 secondes.</div>
            </div>
          </>
        )}

        {phase === "tracking" && !ticket && (
          <div style={{ padding:"48px 0", textAlign:"center", color:"#9CA3AF", fontSize:13 }}>Connexion au serveur…</div>
        )}

        {/* ── Phase: VALIDATE ── */}
        {phase === "validate" && ticket && (
          <>
            <WorkflowTimeline ticket={ticket} />

            {hasQuestions && (
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #E5E7EB", marginBottom:20 }}>
                {[{ key:"overview", label:"Résumé" }, { key:"questions", label:`Questions (${result.question_scores.length})` }].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ padding:"9px 18px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:tab===t.key?600:400, color:tab===t.key?"#12214B":"#6B7280", borderBottom:tab===t.key?"2px solid #12214B":"2px solid transparent", transition:"all 0.12s" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "overview" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
                  {[
                    { label:"Décision",      value:result.final_decision||"—",               color:result.final_decision==="Approved"?"#059669":result.final_decision==="Rejected"?"#E30613":"#D97706" },
                    { label:"Niveau risque", value:result.overall_score||"—",                 color:RISK_COLORS[result.overall_score]||"#6B7280" },
                    { label:"Score global",  value:result.global_score!=null?`${result.global_score}/4`:"—", color:"#12214B" },
                    { label:"Showstoppers",  value:result.showstopper_count??"—",             color:result.showstopper_count>0?"#E30613":"#059669" },
                  ].map(({ label,value,color }) => (
                    <div key={label} style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
                      <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:4 }}>{label.toUpperCase()}</div>
                      <div style={{ color, fontSize:16, fontWeight:600 }}>{value}</div>
                    </div>
                  ))}
                </div>
                {result.executive_summary && (
                  <div style={{ background:"#F9FAFB", borderRadius:8, padding:"12px 14px", marginBottom:14, border:"1px solid #E5E7EB" }}>
                    <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>RÉSUMÉ EXÉCUTIF</div>
                    <p style={{ color:"#2D3748", fontSize:13, lineHeight:1.7, margin:0 }}>{result.executive_summary}</p>
                  </div>
                )}
                {result.showstoppers?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ color:"#E30613", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>SHOWSTOPPERS</div>
                    {result.showstoppers.map((s,i) => (
                      <div key={i} style={{ background:"#FFF0F0", borderRadius:6, padding:"8px 12px", marginBottom:5, color:"#8B0008", fontSize:12, border:"1px solid #FFBCBF" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:5,flexShrink:0,verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>{s}</div>
                    ))}
                  </div>
                )}
                {hasQuestions && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                      <span style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em" }}>APERÇU DES QUESTIONS</span>
                      <button onClick={() => setTab("questions")} style={{ background:"none", border:"none", color:"#12214B", fontSize:11, cursor:"pointer", fontWeight:500 }}>
                        Voir toutes ({result.question_scores.length}) →
                      </button>
                    </div>
                    {result.question_scores.slice(0,6).map(q => (
                      <div key={q.question_id}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom: q.piece_jointe ? "none" : "1px solid #F3F4F6" }}>
                          <span style={{ background:SCORE_BG[q.score]||"#F3F4F6", color:SCORE_COLORS[q.score]||"#9CA3AF", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${(SCORE_COLORS[q.score]||"#9CA3AF")}22` }}>{q.question_id}</span>
                          <div style={{ flex:1, minWidth:0, color:"#2D3748", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</div>
                          {q.piece_jointe && (
                            <span style={{ padding:"2px 7px", borderRadius:20, fontSize:9, fontWeight:700, background:"rgba(18,33,75,0.07)", color:"#12214B", border:"1px solid rgba(18,33,75,0.15)", flexShrink:0 }}>PJ requise</span>
                          )}
                          <ScorePill score={q.score} />
                          {q.is_showstopper&&<span style={{ color:"#E30613", fontSize:11 }}>⊘</span>}
                        </div>
                        {q.piece_jointe && (
                          <div style={{ marginBottom:6 }}>
                            <PJRow q={q} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "questions" && hasQuestions && <QuestionList questions={result.question_scores} />}

            {/* Separator */}
            <div style={{ borderTop:"1px solid #E5E7EB", marginTop:4, paddingTop:20 }}>
              {result.final_decision === "Rejected" ? (
                <div style={{ background:"#FFF0F0", border:"1px solid #FFBCBF", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>🚫</span>
                  <span style={{ color:"#8B0008", fontSize:12, fontWeight:500 }}>
                    L'analyse recommande le <strong>rejet</strong> de ce fournisseur ({result.showstopper_count ?? 0} showstopper{result.showstopper_count > 1 ? "s" : ""}). Confirmez ou substituez la décision.
                  </span>
                </div>
              ) : (
                <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>⚠️</span>
                  <span style={{ color:"#92400E", fontSize:12, fontWeight:500 }}>Ce ticket nécessite une validation manuelle avant d'être finalisé.</span>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#2D3748", marginBottom:5 }}>Commentaires (optionnel)</label>
                <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} placeholder="Ajoutez vos commentaires…"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#0F172A", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => sendValidation(false)} disabled={sending}
                  style={{ flex:1, padding:"11px 0", borderRadius:8, background:"#FFF0F0", border:"1px solid #FFBCBF", color:"#E30613", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  Confirmer le rejet
                </button>
                <button onClick={() => sendValidation(true)} disabled={sending}
                  style={{ flex:2, padding:"11px 0", borderRadius:8, background:"#12214B", border:"1px solid #0E1A3A", color:"#fff", cursor:sending?"wait":"pointer", fontSize:13, fontWeight:600 }}>
                  {sending ? "Envoi…" : result.final_decision === "Rejected" ? "Passer outre & Approuver" : "Approuver & Générer Excel"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Phase: DONE (auto-completed or rejected) ── */}
        {phase === "done" && ticket && (() => {
          const finalDecision = ticket.result?.final_decision;
          const isApproved    = ticket.status === "completed" && finalDecision !== "Rejected";
          const isRejected    = ticket.status === "completed" && finalDecision === "Rejected";
          const isError       = ticket.status === "error";
          return (
            <>
              <WorkflowTimeline ticket={ticket} />
              <div style={{ textAlign:"center", padding:"24px 0 28px" }}>
                {isApproved && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#059669", marginBottom:4 }}>Analyse terminée — Approuvé</div>
                    <div style={{ color:"#9CA3AF", fontSize:12 }}>Le ticket a été validé automatiquement et ajouté à la liste.</div>
                    <button onClick={() => window.open(`${API}/tickets/${ticket.id}/download`, "_blank")}
                      style={{ marginTop:20, padding:"9px 24px", borderRadius:8, background:"#ECFDF5", border:"1px solid #A7F3D0", color:"#059669", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      ⬇ Télécharger Excel
                    </button>
                  </>
                )}
                {isRejected && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>🚫</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#E30613", marginBottom:4 }}>Analyse terminée — Rejeté</div>
                    <div style={{ color:"#9CA3AF", fontSize:12, marginBottom:16 }}>
                      La décision finale est <strong style={{ color:"#E30613" }}>Rejected</strong> en raison de risques critiques détectés.
                    </div>
                    {ticket.result?.showstoppers?.length > 0 && (
                      <div style={{ textAlign:"left", maxWidth:420, margin:"0 auto 16px", background:"#FFF0F0", border:"1px solid #FFBCBF", borderRadius:8, padding:"10px 14px" }}>
                        <div style={{ color:"#E30613", fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:6 }}>SHOWSTOPPERS</div>
                        {ticket.result.showstoppers.map((s, i) => (
                          <div key={i} style={{ color:"#8B0008", fontSize:12, marginBottom:4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:5,flexShrink:0,verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>{s}</div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => window.open(`${API}/tickets/${ticket.id}/download`, "_blank")}
                      style={{ marginTop:4, padding:"9px 24px", borderRadius:8, background:"#FFF0F0", border:"1px solid #FFBCBF", color:"#E30613", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      ⬇ Télécharger le rapport Excel
                    </button>
                  </>
                )}
                {isError && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>❌</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#E30613", marginBottom:4 }}>Une erreur s'est produite</div>
                    <div style={{ color:"#9CA3AF", fontSize:12 }}>Le workflow a rencontré une erreur. Vérifiez les logs.</div>
                  </>
                )}
              </div>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <button onClick={onClose} style={{ padding:"9px 28px", borderRadius:8, background:"#EEF1F8", border:"1px solid #B8C3DE", color:"#12214B", cursor:"pointer", fontSize:13, fontWeight:500 }}>Fermer</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onLaunched }) {
  const [vendor, setVendor]   = useState("");
  const [project, setProject] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [drag, setDrag]       = useState(false);

  async function submit() {
    if (!vendor || !file) { setError("Le fournisseur et le fichier sont requis."); return; }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("vendor", vendor); fd.append("project", project||"Non spécifié");
    fd.append("analyst", analyst||"Analyste"); fd.append("file", file);
    try {
      const res = await fetch(`${API}/tickets`, { method:"POST", body:fd });
      if (!res.ok) throw new Error(await res.text());
      const ticket = await res.json();
      onLaunched(ticket.id);
    } catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:460, boxShadow:"0 20px 60px rgba(0,0,0,0.1)", border:"1px solid #E5E7EB" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:"#0F172A" }}>Nouveau ticket TPRA</div>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Lancer une analyse de risque fournisseur</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {[
          { label:"Fournisseur *", val:vendor,  set:setVendor,  ph:"Acme Corp" },
          { label:"Projet",        val:project, set:setProject, ph:"Migration ERP" },
          { label:"Analyste",      val:analyst, set:setAnalyst, ph:"Jean Dupont" },
        ].map(({ label,val,set,ph }) => (
          <div key={label} style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#2D3748", marginBottom:5 }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#0F172A", fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#2D3748", marginBottom:5 }}>Fichier * (.xlsx, .pdf, .txt)</label>
          <div onClick={() => document.getElementById("fu-input").click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0]); }}
            style={{ border:`1.5px dashed ${drag?"#12214B":"#D1D5DB"}`, borderRadius:8, padding:"18px 14px", textAlign:"center", cursor:"pointer", background:drag?"#EEF1F8":"#F9FAFB", transition:"all 0.15s" }}>
            <input id="fu-input" type="file" style={{ display:"none" }} accept=".xlsx,.xls,.pdf,.txt,.eml" onChange={e => setFile(e.target.files[0])} />
            {file
              ? <span style={{ color:"#12214B", fontSize:13, fontWeight:500 }}>📎 {file.name}</span>
              : <span style={{ color:"#9CA3AF", fontSize:12 }}>Glissez un fichier ou cliquez pour parcourir</span>}
          </div>
        </div>
        {error && <div style={{ background:"#FFF0F0", border:"1px solid #FFBCBF", borderRadius:7, padding:"9px 12px", color:"#E30613", fontSize:12, marginBottom:14 }}>{error}</div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:8, background:"#F3F4F6", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13, fontWeight:500 }}>Annuler</button>
          <button onClick={submit} disabled={loading} style={{ flex:2, padding:"10px 0", borderRadius:8, background:loading?"#8FA3CC":"#12214B", border:"none", color:"#fff", cursor:loading?"wait":"pointer", fontSize:13, fontWeight:600 }}>
            {loading ? "Lancement…" : "Lancer l'analyse"}
          </button>
        </div>
      </div>
    </div>
  );
}


function DetailModal({ ticket: initialTicket, onClose, onDone, dark=true }) {
  const [ticket, setTicket]     = useState(initialTicket);
  const [fetching, setFetching] = useState(true);
  const [comments, setComments] = useState("");
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState("overview");

  const D = dark ? {
    bg:       "#0d1e3a",
    surface:  "rgba(255,255,255,0.05)",
    surfHigh: "rgba(255,255,255,0.08)",
    border:   "rgba(255,255,255,0.1)",
    text:     "#ffffff",
    muted:    "rgba(255,255,255,0.5)",
    faint:    "rgba(255,255,255,0.25)",
    overlay:  "rgba(0,0,0,0.7)",
    footerBg: "rgba(0,0,0,0.3)",
    inputBg:  "rgba(255,255,255,0.05)",
    tabActive:"#E30613",
  } : {
    bg:       "#ffffff",
    surface:  "#f8fafc",
    surfHigh: "#f1f5f9",
    border:   "#e2e8f0",
    text:     "#0f172a",
    muted:    "#64748b",
    faint:    "#94a3b8",
    overlay:  "rgba(0,0,0,0.35)",
    footerBg: "#f8fafc",
    inputBg:  "#ffffff",
    tabActive:"#E30613",
  };

  useEffect(() => {
    setFetching(true);
    fetch(`${API}/tickets/${initialTicket.id}`)
      .then(r => r.json())
      .then(data => { setTicket(data); setFetching(false); })
      .catch(() => setFetching(false));
  }, [initialTicket.id]);

  const [attachments, setAttachments] = useState({});   // { question_id: [att, ...] }
  const [uploading, setUploading]     = useState({});   // { question_id: bool }

  const fetchAttachments = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/tickets/${initialTicket.id}/attachments`);
      const list = await res.json();
      const grouped = list.reduce((acc, a) => {
        if (!acc[a.question_id]) acc[a.question_id] = [];
        acc[a.question_id].push(a);
        return acc;
      }, {});
      setAttachments(grouped);
    } catch(e) { console.error(e); }
  }, [initialTicket.id]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  async function uploadFile(questionId, file) {
    setUploading(u => ({ ...u, [questionId]: true }));
    const fd = new FormData();
    fd.append("question_id", questionId);
    fd.append("file", file);
    try {
      await fetch(`${API}/tickets/${initialTicket.id}/attachments`, { method:"POST", body:fd });
      await fetchAttachments();
    } catch(e) { console.error(e); }
    setUploading(u => ({ ...u, [questionId]: false }));
  }

  async function deleteAttachment(attId) {
    try {
      await fetch(`${API}/tickets/${initialTicket.id}/attachments/${attId}`, { method:"DELETE" });
      await fetchAttachments();
    } catch(e) { console.error(e); }
  }

  // pjActions: { [question_id]: "uploaded"|"not_needed"|null }
  const [pjActions, setPjActions]   = useState({});
  const [pjLoading, setPjLoading]   = useState({});

  async function resolvePJ(questionId, action, comment="") {
    setPjLoading(l => ({ ...l, [questionId]: action }));
    try {
      const res = await fetch(`${API}/tickets/${initialTicket.id}/piece-jointe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId, action, comment }),
      });
      const data = await res.json();
      setPjActions(a => ({ ...a, [questionId]: action }));
      // Update local score immediately
      setTicket(t => {
        const result = t.result || t;
        const qs = (result.question_scores || []).map(q =>
          q.question_id === questionId ? { ...q, score: data.new_score, pj_action: action } : q
        );
        const newResult = { ...result, question_scores: qs, global_score: data.global_score };
        return t.result ? { ...t, result: newResult } : newResult;
      });
    } catch(e) { console.error(e); }
    setPjLoading(l => ({ ...l, [questionId]: null }));
  }

  // Upload + auto-resolve
  async function uploadFileAndResolve(questionId, file) {
    setUploading(u => ({ ...u, [questionId]: true }));
    const fd = new FormData();
    fd.append("question_id", questionId);
    fd.append("file", file);
    try {
      await fetch(`${API}/tickets/${initialTicket.id}/attachments`, { method:"POST", body:fd });
      await fetchAttachments();
      // Only resolve if not already done
      if (!pjActions[questionId]) {
        await resolvePJ(questionId, "uploaded");
      }
    } catch(e) { console.error(e); }
    setUploading(u => ({ ...u, [questionId]: false }));
  }

  const result       = ticket.result || ticket;
  const isValidation = ticket.status === "waiting_validation";
  const hasResult    = !!(result.question_scores?.length > 0 || result.final_decision || result.executive_summary);
  const decision     = result.final_decision;
  const isApproved   = decision === "Approved";
  const isRejected   = decision === "Rejected";
  const byHuman      = ticket.validated_by && ticket.validated_by !== "auto";
  const showstoppers = result.question_scores?.filter(q => q.is_showstopper) || [];
  const ssCount      = result.showstopper_count || showstoppers.length || 0;

  const pjTotal   = (result.question_scores||[]).filter(q=>q.piece_jointe).length;
  const pjDone    = Object.values(attachments).flat().length;
  const tabs = [
    { key:"overview",     label:"Résumé" },
    ...(result.question_scores?.length > 0 ? [{ key:"questions",    label:`Questions (${result.question_scores.length})` }] : []),
    ...(result.risks?.length > 0           ? [{ key:"risks",        label:`Risques (${result.risks.length})` }] : []),
    ...(ssCount > 0                        ? [{ key:"showstoppers", label:`Showstoppers (${ssCount})`, red:true }] : []),
    ...(result.question_scores?.length > 0 ? [{ key:"attachments",  label: pjTotal > 0 ? `Pièces jointes (${pjDone}/${pjTotal})` : "Pièces jointes", yellow: true }] : []),
  ];

  async function send(approved) {
    setLoading(true);
    await fetch(`${API}/tickets/${ticket.id}/validate`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ approved, comments, validated_by: ticket.analyst || "Analyste" })
    });
    setLoading(false); onDone();
  }

  // ── Sub-components themed ──────────────────────────────────────────────────

  function KpiCard({ label, value, color }) {
    return (
      <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:"12px 16px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, opacity:0.6 }} />
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", color:D.faint, marginBottom:6 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize:22, fontWeight:800, color: color || D.text, letterSpacing:"-0.02em" }}>{value||"—"}</div>
      </div>
    );
  }

  function OverviewTab() {
    const decColor = isApproved ? "#34D399" : isRejected ? "#F87171" : D.muted;
    const riskColor = { Critical:"#F87171", High:"#F97316", Medium:"#12214B", Low:"#34D399" }[result.overall_score] || D.muted;
    const scores    = result.question_scores || [];
    const counts    = scores.reduce((a,q)=>{ a[q.score]=(a[q.score]||0)+1; return a; },{});
    const total     = scores.length || 1;
    const SCORE_C   = { 4:"#34D399", 3:"#FBBF24", 2:"#F97316", 1:"#F87171" };

    return (
      <div>
        {/* Decision banner */}
        {decision && (
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, marginBottom:20,
            background: isApproved ? "rgba(52,211,153,0.08)" : isRejected ? "rgba(227,6,19,0.08)" : D.surface,
            border: isApproved ? "1px solid rgba(52,211,153,0.2)" : isRejected ? "1px solid rgba(227,6,19,0.2)" : `1px solid ${D.border}` }}>
            <div style={{ width:36, height:36, borderRadius:10, background: isApproved?"rgba(52,211,153,0.15)":"rgba(227,6,19,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isApproved
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color: isApproved?"#34D399":"#F87171" }}>Décision finale : {decision}</div>
              {result.overall_score && <div style={{ fontSize:12, color:D.muted, marginTop:2 }}>Niveau de risque global : <span style={{ color:riskColor, fontWeight:600 }}>{result.overall_score}</span></div>}
            </div>
          </div>
        )}

        {/* KPI grid 2x4 */}
        {(() => {
          const pjCount = (result.question_scores||[]).filter(q=>q.piece_jointe).length;
          const pjDone  = pjCount > 0 ? Object.values(attachments).flat().length : 0;
          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
              <KpiCard label="Décision"        value={decision}                                       color={decColor} />
              <KpiCard label="Niveau de risque" value={result.overall_score}                          color={riskColor} />
              <KpiCard label="Score global"    value={result.global_score!=null?`${result.global_score}/4`:null} color="#7A96D4" />
              <KpiCard label="Questions"       value={result.question_scores?.length}                 color={D.muted} />
              <KpiCard label="Showstoppers"    value={ssCount}                                        color={ssCount>0?"#F87171":"#34D399"} />
              <KpiCard label="Scores ≤ 2"     value={scores.filter(q=>q.score<=2).length||null}      color="#F97316" />
              <KpiCard label="Risques identifiés" value={result.risks?.length}                        color="#7A96D4" />
              {pjCount > 0
                ? <KpiCard label="Pièces jointes" value={`${pjDone}/${pjCount}`} color={pjDone>=pjCount?"#34D399":"#12214B"} />
                : <KpiCard label="Analyste" value={ticket.validated_by==="auto"?"Auto":ticket.analyst} color={D.muted} />}
            </div>
          );
        })()}

        {/* Executive summary */}
        {result.executive_summary && (
          <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:D.faint, marginBottom:8 }}>RÉSUMÉ EXÉCUTIF</div>
            <p style={{ color:D.text, fontSize:13, lineHeight:1.75, margin:0 }}>{result.executive_summary}</p>
          </div>
        )}

        {/* Pièces jointes manquantes */}
        {(() => {
          const pjQs = (result.question_scores||[]).filter(q=>q.piece_jointe);
          const missing = pjQs.filter(q=>!(attachments[q.question_id]?.length>0));
          if (!pjQs.length) return null;
          return (
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:3, height:16, borderRadius:2, background:"#12214B" }} />
                  <span style={{ fontSize:13, fontWeight:700, color:"#12214B" }}>PIÈCES JOINTES ({pjQs.length})</span>
                  {missing.length > 0
                    ? <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(18,33,75,0.1)", color:"#12214B", fontSize:10, fontWeight:700 }}>{missing.length} manquante{missing.length>1?"s":""}</span>
                    : <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(52,211,153,0.12)", color:"#34D399", fontSize:10, fontWeight:700 }}>Complètes ✓</span>}
                </div>
                <button onClick={()=>setTab("questions")} style={{ background:"none", border:"none", color:"#12214B", fontSize:11, fontWeight:600, cursor:"pointer" }}>Gérer →</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:6 }}>
                {pjQs.map(q => {
                  const atts = attachments[q.question_id]||[];
                  const done = atts.length > 0;
                  return (
                    <div key={q.question_id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8,
                      background: done?"rgba(52,211,153,0.06)":"rgba(18,33,75,0.06)",
                      border: done?"1px solid rgba(52,211,153,0.15)":"1px solid rgba(251,191,36,0.2)" }}>
                      {done
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#12214B" strokeWidth="2.5" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>}
                      <span style={{ fontSize:10, fontWeight:700, color:done?"#34D399":"#12214B", fontFamily:"monospace" }}>{q.question_id}</span>
                      <span style={{ fontSize:10, color:D.muted, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {done ? `${atts.length} fichier${atts.length>1?"s":""}` : "En attente"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Showstoppers preview */}
        {ssCount > 0 && result.showstoppers?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:16, borderRadius:2, background:"#F87171" }} />
                <span style={{ fontSize:13, fontWeight:700, color:"#F87171" }}>SHOWSTOPPERS ({ssCount})</span>
              </div>
              {tabs.find(t=>t.key==="showstoppers") &&
                <button onClick={()=>setTab("showstoppers")} style={{ background:"none", border:"none", color:"#F87171", fontSize:11, fontWeight:600, cursor:"pointer" }}>Voir le détail →</button>}
            </div>
            {result.showstoppers.map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 14px", borderRadius:8, marginBottom:6, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.18)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span style={{ color:"#F87171", fontSize:12, lineHeight:1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Score distribution bar */}
        {scores.length > 0 && (
          <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:D.faint, marginBottom:12 }}>DISTRIBUTION DES SCORES</div>
            <div style={{ display:"flex", height:10, borderRadius:6, overflow:"hidden", marginBottom:12 }}>
              {[4,3,2,1].map(s => counts[s] ? (
                <div key={s} style={{ flex:counts[s], background:SCORE_C[s], transition:"flex 0.3s" }} title={`${s}/4 : ${counts[s]}`} />
              ) : null)}
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[4,3,2,1].filter(s=>counts[s]).map(s=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:9, height:9, borderRadius:3, background:SCORE_C[s] }} />
                  <span style={{ color:D.muted, fontSize:11 }}>
                    {counts[s]} {["","Non-conforme","Partiel","Conforme","Mature"][s]} ({Math.round(counts[s]/total*100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks preview */}
        {result.risks?.length > 0 && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:16, borderRadius:2, background:"#7A96D4" }} />
                <span style={{ fontSize:13, fontWeight:700, color:D.text }}>RISQUES IDENTIFIÉS ({result.risks.length})</span>
              </div>
              <button onClick={()=>setTab("risks")} style={{ background:"none", border:"none", color:"#7A96D4", fontSize:11, fontWeight:600, cursor:"pointer" }}>Voir tous →</button>
            </div>
            {result.risks.slice(0,3).map((r,i) => {
              const rc = { Critical:"#F87171", High:"#F97316", Medium:"#12214B", Low:"#34D399" }[r.level]||D.muted;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:`1px solid ${D.border}` }}>
                  <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:`rgba(${rc==="#F87171"?"248,113,113":rc==="#F97316"?"249,115,22":rc==="#12214B"?"251,191,36":"52,211,153"},0.12)`, color:rc, flexShrink:0 }}>{r.level}</span>
                  <span style={{ color:D.text, fontSize:12, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Questions preview with PJ upload */}
        {scores.length > 0 && (
          <div style={{ marginTop:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:16, borderRadius:2, background:"#E30613" }} />
                <span style={{ fontSize:13, fontWeight:700, color:D.text }}>APERÇU DES QUESTIONS</span>
              </div>
              <button onClick={()=>setTab("questions")} style={{ background:"none", border:"none", color:D.muted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                Voir toutes ({scores.length}) →
              </button>
            </div>
            <div style={{ border:`1px solid ${D.border}`, borderRadius:12, overflow:"hidden" }}>
              {scores.slice(0, 6).map((q, i) => {
                const SCORE_C  = { 4:"#34D399", 3:"#FBBF24", 2:"#F97316", 1:"#F87171" };
                const SCORE_BG = { 4:"rgba(52,211,153,0.1)", 3:"rgba(251,191,36,0.1)", 2:"rgba(249,115,22,0.1)", 1:"rgba(248,113,113,0.1)" };
                const LABELS   = { 1:"Non-conforme", 2:"Partiel", 3:"Conforme", 4:"Mature" };
                const c        = SCORE_C[q.score] || D.faint;
                const hasPJ    = !!q.piece_jointe;
                const qAtts    = attachments[q.question_id] || [];
                const pjDoneQ  = qAtts.length > 0;
                return (
                  <div key={q.question_id} style={{ borderBottom: i < Math.min(scores.length,6)-1 ? `1px solid ${D.border}` : "none" }}>
                    {/* Main question row */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px" }}>
                      <span style={{ background:SCORE_BG[q.score]||"rgba(255,255,255,0.05)", color:c, fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${c}22` }}>{q.question_id}</span>
                      <div style={{ flex:1, minWidth:0, color:D.text, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</div>
                      {/* PJ status chip */}
                      {hasPJ && (
                        <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700,
                          background: pjDoneQ ? "rgba(52,211,153,0.1)" : "rgba(18,33,75,0.07)",
                          color:       pjDoneQ ? "#34D399" : "#12214B",
                          border:      pjDoneQ ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(251,191,36,0.25)" }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          {pjDoneQ ? `${qAtts.length} doc.` : "PJ requise"}
                        </div>
                      )}
                      <span style={{ background:SCORE_BG[q.score], color:c, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, flexShrink:0, border:`1px solid ${c}33` }}>{q.score}/4 · {LABELS[q.score]}</span>
                      {q.is_showstopper && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
                    </div>
                    {/* PJ action zone — upload OR declare not needed */}
                    {hasPJ && (() => {
                      const action   = pjActions[q.question_id] || q.pj_action;
                      const loading  = pjLoading[q.question_id];
                      const resolved = !!action;
                      const isUpload = action === "uploaded";
                      const isWaived = action === "not_needed";

                      return (
                        <div style={{ margin:"0 14px 10px 14px", padding:"12px 14px", borderRadius:10,
                          background: isUpload ? "rgba(52,211,153,0.05)" : isWaived ? "rgba(122,150,212,0.05)" : "rgba(18,33,75,0.04)",
                          border:     isUpload ? "1px solid rgba(52,211,153,0.2)" : isWaived ? "1px solid rgba(122,150,212,0.2)" : "1px dashed rgba(18,33,75,0.25)" }}>

                          {/* Header */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isUpload?"#34D399":isWaived?"#7A96D4":"#12214B"} strokeWidth="2.5" strokeLinecap="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            <span style={{ fontSize:10, fontWeight:700, color: isUpload?"#34D399":isWaived?"#7A96D4":"#12214B" }}>
                              {isUpload ? "Document fourni — Score → 4/4" : isWaived ? "Pas de PJ nécessaire — Score → 4/4" : `Pièce jointe · réf. ${q.piece_jointe}`}
                            </span>
                            {resolved && (
                              <span style={{ marginLeft:"auto", padding:"1px 7px", borderRadius:20, fontSize:9, fontWeight:800,
                                background: isUpload?"rgba(52,211,153,0.12)":"rgba(122,150,212,0.12)",
                                color:      isUpload?"#34D399":"#7A96D4",
                                border:     isUpload?"1px solid rgba(52,211,153,0.2)":"1px solid rgba(122,150,212,0.2)" }}>
                                4/4 · Mature
                              </span>
                            )}
                          </div>

                          {/* Uploaded files list */}
                          {qAtts.map(att => (
                            <div key={att.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 9px", borderRadius:7, marginBottom:6,
                              background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.18)" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                              <span style={{ flex:1, fontSize:11, color:"#34D399", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{att.filename}</span>
                              <button onClick={()=>window.open(`${API}/tickets/${initialTicket.id}/attachments/${att.id}/download`,"_blank")}
                                style={{ background:"none", border:"none", color:"#34D399", cursor:"pointer", padding:2, display:"flex" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </button>
                              <button onClick={()=>deleteAttachment(att.id)}
                                style={{ background:"none", border:"none", color:"#F87171", cursor:"pointer", padding:2, display:"flex" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                              </button>
                            </div>
                          ))}

                          {/* Actions — show if not resolved yet, or allow change */}
                          {!resolved && (
                            <div style={{ display:"flex", gap:8, marginTop: qAtts.length>0?8:0 }}>
                              {/* Upload */}
                              <label style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:8, cursor:"pointer",
                                background:"rgba(18,33,75,0.07)", border:"1px solid rgba(251,191,36,0.3)", color:"#12214B", fontSize:11, fontWeight:700, transition:"all 0.15s" }}>
                                {loading==="uploaded"
                                  ? <><span style={{ width:7, height:7, borderRadius:"50%", background:"#12214B", display:"inline-block", animation:"blink 1.4s infinite" }} /> Envoi…</>
                                  : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Déposer le document</>}
                                <input type="file" style={{ display:"none" }} disabled={!!loading}
                                  onChange={e=>{ if(e.target.files[0]) uploadFileAndResolve(q.question_id, e.target.files[0]); e.target.value=""; }} />
                              </label>
                              {/* Not needed */}
                              <button onClick={()=>resolvePJ(q.question_id, "not_needed")} disabled={!!loading}
                                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0", borderRadius:8, cursor:"pointer",
                                  background:"rgba(122,150,212,0.08)", border:"1px solid rgba(122,150,212,0.2)", color:"#7A96D4", fontSize:11, fontWeight:700 }}>
                                {loading==="not_needed"
                                  ? <><span style={{ width:7, height:7, borderRadius:"50%", background:"#7A96D4", display:"inline-block", animation:"blink 1.4s infinite" }} /> En cours…</>
                                  : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Pas besoin de PJ</>}
                              </button>
                            </div>
                          )}

                          {/* If resolved — show change option */}
                          {resolved && !isWaived && (
                            <label style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, cursor:"pointer",
                              background:"transparent", border:`1px solid rgba(52,211,153,0.2)`, color:"#34D399", fontSize:10, fontWeight:600, marginTop: qAtts.length>0?6:0 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              Ajouter un autre fichier
                              <input type="file" style={{ display:"none" }}
                                onChange={e=>{ if(e.target.files[0]) { uploadFile(q.question_id, e.target.files[0]); } e.target.value=""; }} />
                            </label>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  function QuestionsTab() {
    const [search, setSearch] = useState("");
    const [sf, setSf] = useState("all");
    const [exp, setExp] = useState(null);
    const SCORE_C = { 4:"#34D399", 3:"#FBBF24", 2:"#F97316", 1:"#F87171" };
    const SCORE_BG = { 4:"rgba(52,211,153,0.1)", 3:"rgba(251,191,36,0.1)", 2:"rgba(249,115,22,0.1)", 1:"rgba(248,113,113,0.1)" };
    const LABELS = { 1:"Non-conforme", 2:"Partiel", 3:"Conforme", 4:"Mature" };
    const qs = (result.question_scores||[]).filter(q => {
      const ms = !search || q.question?.toLowerCase().includes(search.toLowerCase()) || q.question_id?.toLowerCase().includes(search.toLowerCase());
      return ms && (sf==="all" || String(q.score)===sf);
    });
    const cnts = (result.question_scores||[]).reduce((a,q)=>{a[q.score]=(a[q.score]||0)+1;return a;},{});
    return (
      <div>
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:4 }}>
            {["all","4","3","2","1"].map(s=>{
              const active=sf===s;
              const c=s==="all"?D.text:SCORE_C[+s];
              return <button key={s} onClick={()=>setSf(active&&s!=="all"?"all":s)}
                style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:600, cursor:"pointer",
                  background:active?(s==="all"?D.surfHigh:SCORE_BG[+s]):"transparent",
                  border:active?`1px solid ${c}33`:`1px solid transparent`, color:active?c:D.faint }}>
                {s==="all"?"Tous":`${s}/4`}{s!=="all"&&cnts[+s]?` (${cnts[+s]})`:""}
              </button>;
            })}
          </div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",color:D.faint,display:"flex" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ padding:"5px 10px 5px 24px", borderRadius:7, background:D.inputBg, border:`1px solid ${D.border}`, color:D.text, fontSize:11, outline:"none" }} />
          </div>
        </div>
        <div style={{ border:`1px solid ${D.border}`, borderRadius:10, overflow:"hidden" }}>
          {qs.length===0 ? <div style={{ padding:24, textAlign:"center", color:D.faint, fontSize:12 }}>Aucune question</div>
          : qs.map((q,i) => {
            const c=SCORE_C[q.score]||D.faint;
            const isEx=exp===q.question_id;
            return (
              <div key={q.question_id} onClick={()=>setExp(isEx?null:q.question_id)}
                style={{ borderBottom:i<qs.length-1?`1px solid ${D.border}`:"none", cursor:"pointer", background:isEx?D.surfHigh:"transparent", transition:"background 0.1s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px" }}>
                  <div style={{ width:3, height:36, borderRadius:2, background:c, flexShrink:0, marginTop:2 }} />
                  <span style={{ background:SCORE_BG[q.score]||D.surface, color:c, fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", marginTop:2 }}>{q.question_id}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:D.text, fontSize:12, lineHeight:1.5, overflow:isEx?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:isEx?"normal":"nowrap" }}>{q.question}</div>
                    {isEx && (
                      <div style={{ marginTop:8 }}>
                        {q.response && <div style={{ marginBottom:6 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.08em", marginBottom:3 }}>RÉPONSE FOURNISSEUR</div>
                          <div style={{ color:D.muted, fontSize:11, lineHeight:1.6, borderLeft:`2px solid rgba(${c==="#34D399"?"52,211,153":c==="#12214B"?"251,191,36":c==="#F97316"?"249,115,22":"248,113,113"},0.3)`, paddingLeft:8 }}>{q.response}</div>
                        </div>}
                        {q.justification && <div style={{ marginBottom:6 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.08em", marginBottom:3 }}>JUSTIFICATION</div>
                          <div style={{ color:D.muted, fontSize:11, lineHeight:1.6, borderLeft:`2px solid ${D.border}`, paddingLeft:8 }}>{q.justification}</div>
                        </div>}
                        {q.follow_up_question && <div style={{ background:"rgba(122,150,212,0.08)", borderRadius:6, padding:"6px 10px", border:"1px solid rgba(122,150,212,0.2)" }}>
                          <span style={{ fontSize:9, fontWeight:700, color:"#7A96D4" }}>❓ </span>
                          <span style={{ fontSize:11, color:"#7A96D4" }}>{q.follow_up_question}</span>
                        </div>}

                        {/* ── Pièce jointe ── */}
                        {q.piece_jointe && (
                          <div style={{ marginTop:8, background:"rgba(18,33,75,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:8, padding:"10px 12px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#12214B" strokeWidth="2.5" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                              <span style={{ fontSize:10, fontWeight:700, color:"#12214B", letterSpacing:"0.08em" }}>PIÈCE JOINTE REQUISE</span>
                            </div>
                            <div style={{ fontSize:11, color:D.muted, marginBottom:10, lineHeight:1.5 }}>{q.piece_jointe}</div>

                            {/* Existing attachments */}
                            {(attachments[q.question_id]||[]).map(att => (
                              <div key={att.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", borderRadius:6, background:"rgba(18,33,75,0.07)", marginBottom:5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#12214B" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                <span style={{ flex:1, fontSize:11, color:"#12214B", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{att.filename}</span>
                                <button
                                  onClick={e=>{e.stopPropagation();window.open(`${API}/tickets/${initialTicket.id}/attachments/${att.id}/download`,"_blank");}}
                                  style={{ background:"none", border:"none", color:"#12214B", cursor:"pointer", fontSize:10, opacity:0.8, padding:"2px 5px", borderRadius:4, display:"flex", alignItems:"center", gap:3 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                </button>
                                <button
                                  onClick={e=>{e.stopPropagation();deleteAttachment(att.id);}}
                                  style={{ background:"none", border:"none", color:"#F87171", cursor:"pointer", fontSize:10, padding:"2px 5px", borderRadius:4, display:"flex", alignItems:"center" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                </button>
                              </div>
                            ))}

                            {/* Upload button */}
                            <div onClick={e=>e.stopPropagation()}>
                              <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:7, background:"rgba(18,33,75,0.08)", border:"1px dashed rgba(251,191,36,0.4)", color:"#12214B", cursor:"pointer", fontSize:11, fontWeight:600 }}>
                                {uploading[q.question_id]
                                  ? <><span style={{ width:8, height:8, borderRadius:"50%", background:"#12214B", display:"inline-block", animation:"blink 1.4s infinite" }} /> Envoi…</>
                                  : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter un document</>}
                                <input type="file" style={{ display:"none" }} disabled={uploading[q.question_id]}
                                  onChange={e=>{ if(e.target.files[0]) uploadFile(q.question_id, e.target.files[0]); e.target.value=""; }} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <span style={{ background:SCORE_BG[q.score], color:c, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, border:`1px solid ${c}33` }}>{q.score}/4 · {LABELS[q.score]}</span>
                    {q.is_showstopper && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
                    <span style={{ color:D.faint, fontSize:10, transform:isEx?"rotate(180deg)":"none", display:"inline-block", transition:"transform 0.2s" }}>▾</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function RisksTab() {
    const [exp, setExp] = useState(null);
    const risks = result.risks || [];
    const byLevel = ["Critical","High","Medium","Low"];
    const RC = { Critical:"#F87171", High:"#F97316", Medium:"#12214B", Low:"#34D399" };
    const RBG = { Critical:"rgba(248,113,113,0.1)", High:"rgba(249,115,22,0.1)", Medium:"rgba(18,33,75,0.07)", Low:"rgba(52,211,153,0.1)" };
    if (!risks.length) return <div style={{ padding:32, textAlign:"center", color:D.faint }}>Aucun risque documenté</div>;
    return (
      <div>
        {byLevel.filter(l=>risks.some(r=>r.level===l)).map(level=>{
          const c=RC[level], bg=RBG[level];
          return (
            <div key={level} style={{ marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ padding:"3px 10px", borderRadius:6, fontSize:10, fontWeight:800, background:bg, color:c, border:`1px solid ${c}33` }}>{level}</span>
                <span style={{ color:D.faint, fontSize:11 }}>{risks.filter(r=>r.level===level).length} risque{risks.filter(r=>r.level===level).length>1?"s":""}</span>
              </div>
              {risks.filter(r=>r.level===level).map((r,i)=>{
                const key=`${level}-${i}`, isEx=exp===key;
                return (
                  <div key={i} onClick={()=>setExp(isEx?null:key)}
                    style={{ border:`1px solid ${isEx?c+"44":D.border}`, borderRadius:10, marginBottom:6, overflow:"hidden", background:isEx?bg:"transparent", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px" }}>
                      <div style={{ width:3, height:18, borderRadius:2, background:c, flexShrink:0 }} />
                      <div style={{ flex:1, fontWeight:600, fontSize:13, color:D.text }}>{r.title}</div>
                      {r.question_ids && <span style={{ color:D.faint, fontSize:10, fontFamily:"monospace", flexShrink:0 }}>{r.question_ids}</span>}
                      <span style={{ color:D.faint, fontSize:10, transform:isEx?"rotate(180deg)":"none", display:"inline-block", transition:"transform 0.2s" }}>▾</span>
                    </div>
                    {isEx && (
                      <div style={{ padding:"0 14px 14px 27px", borderTop:`1px solid ${c}22` }}>
                        {r.description && <div style={{ marginTop:10, marginBottom:10 }}>
                          <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.08em", marginBottom:4 }}>DESCRIPTION</div>
                          <p style={{ fontSize:12, color:D.muted, lineHeight:1.7, margin:0 }}>{r.description}</p>
                        </div>}
                        {r.recommendation && <div style={{ background:"rgba(122,150,212,0.08)", borderRadius:8, padding:"10px 12px", border:"1px solid rgba(122,150,212,0.2)" }}>
                          <div style={{ fontSize:9, fontWeight:700, color:"#7A96D4", letterSpacing:"0.08em", marginBottom:4 }}>RECOMMANDATION</div>
                          <p style={{ fontSize:12, color:"#7A96D4", lineHeight:1.7, margin:0 }}>{r.recommendation}</p>
                        </div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function ShowstoppersTab() {
    if (!showstoppers.length && !result.showstoppers?.length) return <div style={{ padding:32, textAlign:"center", color:D.faint }}>Aucun showstopper</div>;
    return (
      <div>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", borderRadius:12, marginBottom:18, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#F87171", marginBottom:3 }}>{showstoppers.length} problème{showstoppers.length>1?"s":""} bloquant{showstoppers.length>1?"s":""}</div>
            <div style={{ fontSize:12, color:D.muted, lineHeight:1.5 }}>Ces points doivent être résolus avant toute approbation.</div>
          </div>
        </div>
        {showstoppers.map(q => {
          const c = { 4:"#34D399", 3:"#FBBF24", 2:"#F97316", 1:"#F87171" }[q.score]||D.faint;
          return (
            <div key={q.question_id} style={{ border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, marginBottom:12, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:"rgba(248,113,113,0.06)", borderBottom:"1px solid rgba(248,113,113,0.15)" }}>
                <span style={{ background:`rgba(${c==="#34D399"?"52,211,153":c==="#12214B"?"251,191,36":c==="#F97316"?"249,115,22":"248,113,113"},0.12)`, color:c, fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4, fontFamily:"monospace", border:`1px solid ${c}22`, flexShrink:0 }}>{q.question_id}</span>
                <div style={{ flex:1, fontWeight:600, fontSize:12, color:D.text }}>{q.question}</div>
                <span style={{ fontSize:10, fontWeight:700, color:c, background:`rgba(${c==="#34D399"?"52,211,153":c==="#12214B"?"251,191,36":c==="#F97316"?"249,115,22":"248,113,113"},0.1)`, padding:"2px 7px", borderRadius:6 }}>{q.score}/4</span>
              </div>
              <div style={{ padding:"12px 14px" }}>
                {q.response && <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.08em", marginBottom:3 }}>RÉPONSE FOURNISSEUR</div>
                  <p style={{ fontSize:12, color:D.muted, lineHeight:1.6, margin:0 }}>{q.response}</p>
                </div>}
                {q.justification && <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.08em", marginBottom:3 }}>JUSTIFICATION</div>
                  <p style={{ fontSize:12, color:D.muted, lineHeight:1.6, margin:0 }}>{q.justification}</p>
                </div>}
                {q.flag_reason && <div style={{ background:"rgba(248,113,113,0.08)", borderRadius:7, padding:"7px 10px", border:"1px solid rgba(248,113,113,0.2)", marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#F87171", letterSpacing:"0.08em", marginBottom:2 }}>RAISON DU BLOCAGE</div>
                  <p style={{ fontSize:12, color:"#F87171", margin:0 }}>{q.flag_reason}</p>
                </div>}
                {q.follow_up_question && <div style={{ background:"rgba(122,150,212,0.08)", borderRadius:7, padding:"7px 10px", border:"1px solid rgba(122,150,212,0.2)" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#7A96D4", letterSpacing:"0.08em", marginBottom:2 }}>QUESTION DE SUIVI</div>
                  <p style={{ fontSize:12, color:"#7A96D4", margin:0 }}>❓ {q.follow_up_question}</p>
                </div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Attachments Tab ─────────────────────────────────────────────────────────
  function AttachmentsTab() {
    const questions = result.question_scores || [];
    const reqQs     = questions.filter(q => q.piece_jointe);
    const otherQs   = questions.filter(q => !q.piece_jointe);

    function QSection({ qs, title, required }) {
      return (
        <div style={{ marginBottom:24 }}>
          {title && (
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:3, height:16, borderRadius:2, background: required?"#12214B":"rgba(255,255,255,0.2)" }} />
              <span style={{ fontSize:12, fontWeight:700, color: required?"#12214B":D.muted, letterSpacing:"0.05em" }}>{title}</span>
              {required && <span style={{ padding:"1px 7px", borderRadius:20, background:"rgba(18,33,75,0.08)", color:"#12214B", fontSize:10, fontWeight:700 }}>{reqQs.length} question{reqQs.length>1?"s":""}</span>}
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {qs.map(q => {
              const atts    = attachments[q.question_id] || [];
              const hasPJ   = !!q.piece_jointe;
              const isDone  = atts.length > 0;
              const borderC = hasPJ ? (isDone?"rgba(52,211,153,0.25)":"rgba(18,33,75,0.25)") : D.border;
              const bgC     = hasPJ ? (isDone?"rgba(52,211,153,0.04)":"rgba(18,33,75,0.04)") : D.surface;
              return (
                <div key={q.question_id} style={{ border:`1px solid ${borderC}`, borderRadius:12, overflow:"hidden", background:bgC }}>
                  {/* Question header */}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", borderBottom:atts.length>0||true?`1px solid ${D.border}`:"none" }}>
                    <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:5, flexShrink:0, marginTop:1,
                      background: hasPJ?(isDone?"rgba(52,211,153,0.1)":"rgba(18,33,75,0.07)"):"rgba(255,255,255,0.06)",
                      color:      hasPJ?(isDone?"#34D399":"#12214B"):D.faint,
                      border:     hasPJ?(isDone?"1px solid rgba(52,211,153,0.2)":"1px solid rgba(251,191,36,0.2)"):`1px solid ${D.border}` }}>
                      {q.question_id}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:D.text, fontSize:12, lineHeight:1.5, fontWeight:500 }}>{q.question}</div>
                      {q.piece_jointe && (
                        <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:5 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#12214B" strokeWidth="2.5" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          <span style={{ color:"#12214B", fontSize:10, fontStyle:"italic" }}>{q.piece_jointe}</span>
                        </div>
                      )}
                    </div>
                    {/* Status chip */}
                    {hasPJ && (
                      <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:4,
                        padding:"3px 8px", borderRadius:20, fontSize:10, fontWeight:700,
                        background: isDone?"rgba(52,211,153,0.1)":"rgba(18,33,75,0.07)",
                        color: isDone?"#34D399":"#12214B",
                        border: isDone?"1px solid rgba(52,211,153,0.2)":"1px solid rgba(251,191,36,0.2)" }}>
                        {isDone
                          ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> {atts.length} fichier{atts.length>1?"s":""}</>
                          : <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Requis</>}
                      </div>
                    )}
                  </div>

                  {/* Attached files */}
                  <div style={{ padding:"8px 14px" }}>
                    {atts.map(att => (
                      <div key={att.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:8, marginBottom:5,
                        background: hasPJ?"rgba(52,211,153,0.06)":"rgba(255,255,255,0.04)", border:`1px solid ${hasPJ?"rgba(52,211,153,0.15)":D.border}` }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hasPJ?"#34D399":D.muted} strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                        <span style={{ flex:1, fontSize:11, color:hasPJ?"#34D399":D.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{att.filename}</span>
                        <span style={{ fontSize:10, color:D.faint }}>
                          {new Date(att.uploaded_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",timeZone:"Europe/Paris"})}
                        </span>
                        <button onClick={()=>window.open(`${API}/tickets/${initialTicket.id}/attachments/${att.id}/download`,"_blank")}
                          style={{ background:"none", border:"none", color:hasPJ?"#34D399":D.muted, cursor:"pointer", padding:"2px 5px", borderRadius:4, display:"flex", alignItems:"center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                        <button onClick={()=>deleteAttachment(att.id)}
                          style={{ background:"none", border:"none", color:"#F87171", cursor:"pointer", padding:"2px 5px", borderRadius:4, display:"flex", alignItems:"center" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                    ))}

                    {/* Upload zone */}
                    <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px", borderRadius:8, marginTop: atts.length>0?6:0, cursor:"pointer",
                      border: `1.5px dashed ${hasPJ?"rgba(18,33,75,0.28)":D.border}`,
                      background: uploading[q.question_id]?"rgba(18,33,75,0.04)":"transparent",
                      transition:"all 0.15s" }}>
                      {uploading[q.question_id] ? (
                        <><span style={{ width:8, height:8, borderRadius:"50%", background:"#12214B", display:"inline-block", animation:"blink 1.4s infinite" }} />
                        <span style={{ color:"#12214B", fontSize:11, fontWeight:500 }}>Envoi en cours…</span></>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={hasPJ?"#12214B":D.muted} strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span style={{ color:hasPJ?"#12214B":D.muted, fontSize:11, fontWeight:500 }}>
                          {atts.length > 0 ? "Ajouter un autre document" : hasPJ ? "Déposer la pièce jointe" : "Ajouter un document"}
                        </span></>
                      )}
                      <input type="file" style={{ display:"none" }} disabled={uploading[q.question_id]}
                        onChange={e=>{ if(e.target.files[0]) uploadFile(q.question_id, e.target.files[0]); e.target.value=""; }} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        {reqQs.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, marginBottom:20,
            background:"rgba(18,33,75,0.06)", border:"1px solid rgba(251,191,36,0.2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12214B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <span style={{ color:"#12214B", fontSize:12, fontWeight:600 }}>
                {pjDone}/{pjTotal} pièce{pjTotal>1?"s":""} jointe{pjTotal>1?"s":""} fournie{pjTotal>1?"s":""}
              </span>
              <span style={{ color:D.faint, fontSize:11, marginLeft:8 }}>
                {pjDone < pjTotal ? `— ${pjTotal-pjDone} document${pjTotal-pjDone>1?"s":""} manquant${pjTotal-pjDone>1?"s":""}` : "— Toutes les pièces sont fournies ✓"}
              </span>
            </div>
          </div>
        )}
        {reqQs.length > 0 && <QSection qs={reqQs} title="Documents requis par l'analyse" required={true} />}
        {otherQs.length > 0 && <QSection qs={otherQs} title="Autres questions (optionnel)" required={false} />}
      </div>
    );
  }

  // ── Timeline inline ────────────────────────────────────────────────────────
  const steps = (() => {
    if (ticket.workflow_steps) return ticket.workflow_steps;
    const order = ["extract_text","analyze_risks","score_responses","generate_text_report","export_excel"];
    const doneCount = { running:1, waiting_validation:3, completed:5, rejected:3, error:1 }[ticket.status] ?? 0;
    return order.map((key,i) => ({ key, status: i<doneCount?"done":i===doneCount&&["running","error"].includes(ticket.status)?(ticket.status==="error"?"error":"running"):"pending" }));
  })();

  return (
    <div style={{ position:"fixed", inset:0, background:D.overlay, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}>
      <div style={{ background:D.bg, borderRadius:20, width:"min(900px,96vw)", maxHeight:"92vh", display:"flex", flexDirection:"column",
        boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" : "0 32px 80px rgba(18,33,75,0.2), 0 0 0 1px #e2e8f0",
        border:`1px solid ${D.border}` }}>

        {/* ── HEADER ── */}
        <div style={{ padding:"22px 26px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:D.text, letterSpacing:"-0.02em", margin:0 }}>{ticket.vendor}</h2>
                <StatusBadge status={ticket.status} />
                {(ticket.status==="completed"||ticket.status==="rejected") && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700,
                    background: byHuman?"rgba(122,150,212,0.12)":"rgba(52,211,153,0.1)",
                    color: byHuman?"#7A96D4":"#34D399",
                    border: byHuman?"1px solid rgba(122,150,212,0.25)":"1px solid rgba(52,211,153,0.2)" }}>
                    {byHuman
                      ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Approuvé par {ticket.validated_by}</>
                      : <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Approuvé par l'IA</>}
                  </span>
                )}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", color:D.faint, fontSize:12, flexWrap:"wrap" }}>
                {ticket.project && <span>{ticket.project}</span>}
                {ticket.analyst && <><span>·</span><span>{ticket.analyst}</span></>}
                {ticket.created_at && <><span>·</span><span>{fmtDate(ticket.created_at)}</span></>}
                {ticket.filename && (
                  <><span>·</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"1px 7px", borderRadius:5,
                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(18,33,75,0.06)",
                    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(18,33,75,0.15)",
                    color: dark ? "rgba(255,255,255,0.6)" : "#12214B", fontSize:11 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                    {ticket.filename}
                  </span></>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
              {ticket.status==="completed" && (
                <button onClick={()=>window.open(`${API}/tickets/${ticket.id}/download`,"_blank")}
                  style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", color:"#34D399", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Excel
                </button>
              )}
              <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", background:D.surface, border:`1px solid ${D.border}`, color:D.faint, cursor:"pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* Workflow timeline */}
          <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:"10px 14px", marginBottom:16, overflowX:"auto" }}>
            <div style={{ fontSize:9, fontWeight:700, color:D.faint, letterSpacing:"0.1em", marginBottom:10 }}>PROGRESSION DU WORKFLOW</div>
            <div style={{ display:"flex", alignItems:"center", minWidth:"max-content" }}>
              {steps.map((step,i) => {
                const isDone=step.status==="done", isRun=step.status==="running", isErr=step.status==="error";
                const c = isDone?"#34D399":isRun?"#7A96D4":isErr?"#F87171":D.faint;
                const bg= isDone?"rgba(52,211,153,0.08)":isRun?"rgba(122,150,212,0.08)":isErr?"rgba(248,113,113,0.08)":D.surface;
                const bd= isDone?"rgba(52,211,153,0.2)":isRun?"rgba(122,150,212,0.2)":isErr?"rgba(248,113,113,0.2)":D.border;
                return (
                  <div key={step.key} style={{ display:"flex", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:7, background:bg, border:`1px solid ${bd}`, color:c }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:c, animation:isRun?"blink 1.4s infinite":"none", boxShadow:isRun?`0 0 6px ${c}`:"none" }} />
                      <span style={{ fontSize:10, fontWeight:700, fontFamily:"monospace", whiteSpace:"nowrap" }}>{step.key}</span>
                      {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      {isErr  && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    </div>
                    {i<steps.length-1 && <div style={{ width:18, height:1, background:isDone?"rgba(52,211,153,0.3)":D.border, margin:"0 0" }}>
                      <span style={{ float:"right", color:isDone?"rgba(52,211,153,0.5)":D.faint, fontSize:9, lineHeight:"8px", marginTop:-4 }}>›</span>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          {hasResult && (
            <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${D.border}` }}>
              {tabs.map(t => (
                <button key={t.key} onClick={()=>setTab(t.key)}
                  style={{ padding:"10px 16px", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===t.key?700:400,
                    color: tab===t.key ? (t.red?"#F87171":t.yellow?"#12214B":"#fff") : D.muted,
                    borderBottom: tab===t.key ? `2px solid ${t.red?"#F87171":t.yellow?"#12214B":"#E30613"}` : "2px solid transparent",
                    whiteSpace:"nowrap", transition:"all 0.12s" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 26px" }}>
          {fetching ? (
            <div style={{ padding:"48px 0", textAlign:"center" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, color:D.muted, fontSize:13 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#E30613", display:"inline-block", animation:"blink 1.4s infinite" }} />
                Chargement du rapport…
              </div>
            </div>
          ) : !hasResult ? (
            <div style={{ padding:"32px 0", textAlign:"center", color:D.faint, fontSize:13 }}>
              {ticket.status==="running" ? "Analyse en cours…" : ticket.status==="error" ? "Le workflow a rencontré une erreur." : "Aucun résultat disponible."}
            </div>
          ) : (
            <>
              {tab==="overview"     && <OverviewTab />}
              {tab==="questions"    && <QuestionsTab />}
              {tab==="risks"        && <RisksTab />}
              {tab==="showstoppers" && <ShowstoppersTab />}
              {tab==="attachments"  && <AttachmentsTab />}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ padding:"14px 26px", borderTop:`1px solid ${D.border}`, background:D.footerBg, borderRadius:"0 0 20px 20px", flexShrink:0 }}>
          {isValidation ? (
            <>
              <textarea value={comments} onChange={e=>setComments(e.target.value)} rows={2} placeholder="Commentaires (optionnel)…"
                style={{ width:"100%", padding:"8px 12px", borderRadius:8, background:D.inputBg, border:`1px solid ${D.border}`, color:D.text, fontSize:12, outline:"none", resize:"none", boxSizing:"border-box", marginBottom:10 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>send(false)} disabled={loading}
                  style={{ flex:1, padding:"10px", borderRadius:10, background:"rgba(227,6,19,0.1)", border:"1px solid rgba(227,6,19,0.3)", color:"#F87171", cursor:"pointer", fontSize:13, fontWeight:700 }}>Rejeter</button>
                <button onClick={()=>send(true)} disabled={loading}
                  style={{ flex:2, padding:"10px", borderRadius:10, background:"#E30613", border:"none", color:"#fff", cursor:loading?"wait":"pointer", fontSize:13, fontWeight:700 }}>
                  {loading?"Envoi…":"Approuver & Générer Excel"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={onClose}
                style={{ padding:"9px 24px", borderRadius:10, background:D.surface, border:`1px solid ${D.border}`, color:D.muted, cursor:"pointer", fontSize:13, fontWeight:500 }}>Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketRow({ ticket, onSelect, adminMode: isAdmin, checked, onCheck, dark=true, tr:trRow, T={text:"#fff",textMuted:"rgba(255,255,255,0.55)",textFaint:"rgba(255,255,255,0.3)",tableBorder:"rgba(255,255,255,0.05)",rowChecked:"rgba(227,6,19,0.08)",badgeBg:"rgba(255,255,255,0.05)",badgeBorder:"rgba(255,255,255,0.1)",badgeText:"rgba(255,255,255,0.65)"} }) {
  const activeStep = ticket.workflow_steps?.find(s => s.status === "running")?.key;
  const decision   = ticket.final_decision || ticket.result?.final_decision;
  const isApproved = decision === "Approved";
  const isRejected = decision === "Rejected";
  const byHuman    = ticket.validated_by && ticket.validated_by !== "auto";
  const isDone     = ticket.status === "completed" || ticket.status === "rejected";

  return (
    <tr onClick={() => isAdmin ? null : onSelect(ticket)}
      style={{ cursor:isAdmin?"default":"pointer", borderBottom:`1px solid ${T.tableBorder}`,
        background:checked?T.rowChecked:"transparent", transition:"background 0.12s" }}
      onMouseEnter={e=>{ if(!isAdmin&&!checked) e.currentTarget.style.background=T.rowHover; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=checked?T.rowChecked:"transparent"; }}>

      {/* Checkbox */}
      {isAdmin && (
        <td style={{ padding:"14px 14px", width:44 }} onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={checked} onChange={onCheck} />
        </td>
      )}

      {/* Fournisseur / Projet */}
      <td style={{ padding:"14px 18px" }}>
        <div style={{ color:T.text, fontWeight:600, fontSize:13, letterSpacing:"-0.01em" }}>{ticket.vendor}</div>
        {ticket.project && <div style={{ color:T.textFaint, fontSize:11, marginTop:3, fontStyle:"italic" }}>{ticket.project}</div>}
      </td>

      {/* Analyste / Approuvé par */}
      <td style={{ padding:"14px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          {/* Avatar initial */}
          <div style={{ width:26, height:26, borderRadius:"50%", background: dark ? "rgba(58,95,191,0.25)" : "#eef1f8", border: dark ? "1px solid rgba(58,95,191,0.35)" : "1px solid #b8c3de", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ color:"#7A96D4", fontSize:10, fontWeight:700 }}>
              {(ticket.analyst||"?")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ color:T.textMuted, fontSize:12, fontWeight:500 }}>{ticket.analyst||"—"}</div>
            {isDone && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:3,
                padding:"2px 7px", borderRadius:20, fontSize:10, fontWeight:600,
                background: byHuman ? "rgba(122,150,212,0.15)" : "rgba(52,211,153,0.12)",
                color:       byHuman ? "#7A96D4" : "#34D399",
                border:      byHuman ? "1px solid rgba(122,150,212,0.25)" : "1px solid rgba(52,211,153,0.2)" }}>
                {byHuman ? (
                  <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {ticket.validated_by}</>
                ) : (
                  <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> IA automatique</>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Décision */}
      <td style={{ padding:"14px 18px" }}>
        {isDone ? (
          <div style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"5px 11px", borderRadius:8, fontSize:11, fontWeight:600,
            background: isApproved ? "rgba(52,211,153,0.1)" : isRejected ? "rgba(227,6,19,0.1)" : "rgba(255,255,255,0.05)",
            color:       isApproved ? "#34D399" : isRejected ? "#F87171" : "rgba(255,255,255,0.3)",
            border:      isApproved ? "1px solid rgba(52,211,153,0.25)" : isRejected ? "1px solid rgba(227,6,19,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
            {isApproved ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : isRejected ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            ) : (
              <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"inline-block" }} />
            )}
            {isApproved ? (trRow?.approved||"Approuvé") : isRejected ? (trRow?.rejected||"Rejeté") : "—"}
          </div>
        ) : (
          <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>—</span>
        )}
      </td>

      {/* Statut */}
      <td style={{ padding:"14px 18px" }}>
        <StatusBadge status={ticket.status} tr={trRow} />
        {ticket.status === "running" && activeStep && (
          <div style={{ marginTop:4, fontSize:10, color:"rgba(122,150,212,0.7)", fontFamily:"'DM Mono',monospace", letterSpacing:"0.02em" }}>
            › {activeStep}
          </div>
        )}
      </td>

      {/* Date */}
      <td style={{ padding:"14px 18px" }}>
        <div style={{ color:T.textMuted, fontSize:12 }}>
          {fmtDate(ticket.created_at).split(",")[0]}
        </div>
        <div style={{ color:T.textFaint, fontSize:11, marginTop:2 }}>
          {fmtDate(ticket.created_at).split(",")[1]?.trim()}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding:"14px 18px" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {ticket.status === "waiting_validation" && (
            <button onClick={e => { e.stopPropagation(); onSelect(ticket); }}
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7,
                background:"rgba(18,33,75,0.08)", border:"1px solid rgba(251,191,36,0.25)",
                color:"#12214B", cursor:"pointer", fontSize:11, fontWeight:600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Valider
            </button>
          )}
          {ticket.status === "completed" && (
            <button onClick={e => { e.stopPropagation(); window.open(`${API}/tickets/${ticket.id}/download`,"_blank"); }}
              style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7,
                background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.22)",
                color:"#34D399", cursor:"pointer", fontSize:11, fontWeight:600 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Excel
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onSelect(ticket); }}
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:7,
              background:T.badgeBg, border:`1px solid ${T.badgeBorder}`,
              color:T.badgeText, cursor:"pointer", fontSize:11, fontWeight:500 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            Détails
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDeleteModal({ count, onConfirm, onCancel, tr:trDel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000 }}>
      <div style={{ background:"#fff", borderRadius:14, padding:28, width:380, boxShadow:"0 20px 60px rgba(0,0,0,0.12)", border:"1px solid #E5E7EB" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><div style={{ width:52, height:52, borderRadius:14, background:"rgba(227,6,19,0.12)", border:"1px solid rgba(227,6,19,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></div></div>
        <div style={{ fontSize:15, fontWeight:600, color:"#0F172A", textAlign:"center", marginBottom:8 }}>
          Supprimer {count} ticket{count>1?"s":""}
        </div>
        <div style={{ fontSize:13, color:"#6B7280", textAlign:"center", marginBottom:24, lineHeight:1.6 }}>
          Cette action est irréversible. {count>1?"Ces tickets":"Ce ticket"} et {count>1?"leurs":"son"} résultat{count>1?"s":""} seront définitivement supprimé{count>1?"s":""}.
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px 0", borderRadius:8, background:"#F3F4F6", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13, fontWeight:500 }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px 0", borderRadius:8, background:"#E30613", border:"none", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("tpra_user") || "null"); }
    catch { return null; }
  });
  const [T, lang, changeLang, isRtl] = useLang();

  function handleLogin(user) {
    sessionStorage.setItem("tpra_user", JSON.stringify(user));
    setCurrentUser(user);
  }

  function handleLogout() {
    sessionStorage.removeItem("tpra_user");
    setCurrentUser(null);
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} tr={T} lang={lang} changeLang={changeLang} isRtl={isRtl} />;
  return <DashboardApp currentUser={currentUser} onLogout={handleLogout} tr={T} lang={lang} changeLang={changeLang} isRtl={isRtl} />;
}

function DashboardApp({ currentUser, onLogout, tr, lang, changeLang, isRtl }) {
  const isAdmin = currentUser.role === "admin";

  const [tickets, setTickets]             = useState([]);
  const [filter, setFilter]               = useState("all");
  const [search, setSearch]               = useState("");
  const [showUpload, setShowUpload]       = useState(false);
  const [trackingId, setTrackingId]       = useState(null);
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lastRefresh, setLastRefresh]     = useState(Date.now());
  const [checkedIds, setCheckedIds]       = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [dark, setDark]                   = useState(true);

  // Theme tokens
  const T = dark ? {
    bg:           'linear-gradient(160deg,#07101f 0%,#0d1e3a 50%,#091630 100%)',
    surface:      'rgba(255,255,255,0.04)',
    surfaceMid:   'rgba(255,255,255,0.07)',
    border:       'rgba(255,255,255,0.08)',
    borderMid:    'rgba(255,255,255,0.14)',
    headerBg:     'rgba(7,14,32,0.85)',
    headerBorder: 'rgba(58,95,191,0.25)',
    text:         '#ffffff',
    textMuted:    'rgba(255,255,255,0.55)',
    textFaint:    'rgba(255,255,255,0.3)',
    tableBorder:  'rgba(255,255,255,0.05)',
    rowHover:     'rgba(58,95,191,0.08)',
    rowChecked:   'rgba(227,6,19,0.08)',
    filterBg:     'rgba(255,255,255,0.04)',
    filterActive: '#E30613',
    filterText:   'rgba(255,255,255,0.55)',
    inputBg:      'rgba(255,255,255,0.05)',
    inputBorder:  'rgba(255,255,255,0.1)',
    inputText:    '#ffffff',
    badgeBg:      'rgba(255,255,255,0.05)',
    badgeBorder:  'rgba(255,255,255,0.1)',
    badgeText:    'rgba(255,255,255,0.65)',
    thText:       'rgba(255,255,255,0.45)',
    scrollThumb:  '#1e3a6e',
    scrollTrack:  '#0a1428',
  } : {
    bg:           'linear-gradient(160deg,#f0f4f8 0%,#e8eef6 50%,#f0f4f8 100%)',
    surface:      '#ffffff',
    surfaceMid:   '#f8fafc',
    border:       '#e2e8f0',
    borderMid:    '#cbd5e1',
    headerBg:     'rgba(255,255,255,0.92)',
    headerBorder: 'rgba(18,33,75,0.15)',
    text:         '#0f172a',
    textMuted:    '#475569',
    textFaint:    '#94a3b8',
    tableBorder:  '#f1f5f9',
    rowHover:     '#f8fafc',
    rowChecked:   '#fff0f0',
    filterBg:     '#ffffff',
    filterActive: '#E30613',
    filterText:   '#64748b',
    inputBg:      '#ffffff',
    inputBorder:  '#e2e8f0',
    inputText:    '#0f172a',
    badgeBg:      '#f1f5f9',
    badgeBorder:  '#e2e8f0',
    badgeText:    '#475569',
    thText:       '#94a3b8',
    scrollThumb:  '#cbd5e1',
    scrollTrack:  '#f1f5f9',
  };

  const fetchTickets = useCallback(async () => {
    try {
      const url = filter === "all" ? `${API}/tickets` : `${API}/tickets?status=${filter}`;
      const res = await fetch(url);
      setTickets(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, lastRefresh]);
  useEffect(() => {
    const hasActive = tickets.some(t => ["running","waiting_validation"].includes(t.status));
    if (!hasActive) return;
    const id = setInterval(() => setLastRefresh(Date.now()), 10000);
    return () => clearInterval(id);
  }, [tickets]);

  const counts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  const filteredTickets = tickets.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.vendor?.toLowerCase().includes(q) || t.project?.toLowerCase().includes(q) || t.analyst?.toLowerCase().includes(q);
  });

  const FILTERS = [
    { key:"all",                label:"Tous",       count:tickets.length },
    { key:"pending",            label:"En attente", count:counts.pending||0 },
    { key:"running",            label:tr.kpi_running,   count:counts.running||0 },
    { key:"waiting_validation", label:tr.kpi_validate,  count:counts.waiting_validation||0 },
    { key:"completed",          label:tr.kpi_done,   count:counts.completed||0 },
    { key:"rejected",           label:"Rejetés",    count:counts.rejected||0 },
    { key:"error",              label:"Erreurs",    count:counts.error||0 },
  ];

  function toggleCheck(id, e) {
    e.stopPropagation();
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setCheckedIds(checkedIds.size === filteredTickets.length ? new Set() : new Set(filteredTickets.map(t => t.id)));
  }
  async function deleteSelected() {
    setDeleting(true);
    try {
      await Promise.all([...checkedIds].map(id => fetch(`${API}/tickets/${id}`, { method:"DELETE" })));
      setCheckedIds(new Set()); setConfirmDelete(false); setLastRefresh(Date.now());
    } catch(e) { console.error(e); }
    setDeleting(false);
  }

  const allChecked  = filteredTickets.length > 0 && checkedIds.size === filteredTickets.length;
  const someChecked = checkedIds.size > 0;

  return (
    <div dir={isRtl?"rtl":"ltr"} style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans','Segoe UI',sans-serif", transition:"background 0.3s, color 0.3s" }}>
      <style>{[
        `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`,
        `* { box-sizing:border-box; margin:0; padding:0; }`,
        `::-webkit-scrollbar { width:4px; height:4px; }`,
        `::-webkit-scrollbar-track { background:${T.scrollTrack}; }`,
        `::-webkit-scrollbar-thumb { background:${T.scrollThumb}; border-radius:2px; }`,
        `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`,
        `@keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }`,
        `@keyframes kpiIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }`,
        `tbody tr { animation:fadeUp 0.18s ease; }`,
        `input[type=checkbox] { width:14px;height:14px;cursor:pointer;accent-color:#E30613; }`,
        `.kpi-card:nth-child(1){animation:kpiIn 0.4s ease both}.kpi-card:nth-child(2){animation:kpiIn 0.5s ease both}.kpi-card:nth-child(3){animation:kpiIn 0.6s ease both}.kpi-card:nth-child(4){animation:kpiIn 0.7s ease both}.kpi-card:nth-child(5){animation:kpiIn 0.8s ease both}`,
        `.filter-tab:hover{background:${dark?"rgba(255,255,255,0.08)":"rgba(18,33,75,0.07)"}!important;color:${dark?"rgba(255,255,255,0.8)":"#12214B"}!important}`,
        `.trow:hover td{background:${dark?'rgba(58,95,191,0.06)':'rgba(18,33,75,0.03)'}!important}`,
        `.action-btn:hover{opacity:0.85}`,
        `.ticket-action:hover{opacity:1!important;transform:translateY(-1px)}`,
      ].join('\n')}</style>

      {/* ── HEADER ── */}
      <header style={{ background:T.headerBg, backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.headerBorder}`, padding:"0 36px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <img src={CMA_CGM_LOGO} alt="CMA CGM" style={{ height:34, objectFit:"contain", filter: dark ? "brightness(0) invert(1)" : "none" }} />
          <div style={{ width:1, height:24, background: dark ? "rgba(255,255,255,0.1)" : "rgba(18,33,75,0.12)" }} />
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:T.text, letterSpacing:"-0.02em" }}>TPRA Platform</div>
            <div style={{ color:T.textFaint, fontSize:10, letterSpacing:"0.1em", fontWeight:500 }}>THIRD PARTY RISK ASSESSMENT</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* User badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px 6px 8px", borderRadius:28, background:T.surface, border:`1px solid ${T.border}` }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background: isAdmin ? "linear-gradient(135deg,#E30613,#8b0000)" : "linear-gradient(135deg,#3A5FBF,#12214B)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {isAdmin
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{currentUser.name}</div>
              <div style={{ fontSize:9, color:T.textFaint, letterSpacing:"0.08em" }}>{isAdmin?tr.role_admin:tr.role_cyber}</div>
            </div>
          </div>
          {/* Lang selector */}
          <LangSelector lang={lang} changeLang={changeLang} dark={dark} />
          {/* Theme toggle */}
          <button onClick={() => setDark(d=>!d)} className="action-btn"
            style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:T.surface, border:`1px solid ${T.border}`, color:T.textMuted, cursor:"pointer" }}>
            {dark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
          {/* Refresh */}
          <button onClick={()=>setLastRefresh(Date.now())} className="action-btn"
            style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:T.surface, border:`1px solid ${T.border}`, color:T.textMuted, cursor:"pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          {/* New ticket */}
          <button onClick={()=>setShowUpload(true)} className="action-btn"
            style={{ padding:"8px 20px", borderRadius:10, background:"#E30613", border:"none", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, letterSpacing:"0.01em", display:"flex", alignItems:"center", gap:6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nouveau ticket
          </button>
          {/* Logout */}
          <button onClick={onLogout} className="action-btn" title="Déconnexion"
            style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:"transparent", border:`1px solid ${T.border}`, color:T.textFaint, cursor:"pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div style={{ padding:"32px 36px", maxWidth:1400, margin:"0 auto" }}>

        {/* ── Page title + date ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
          <div>
            <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, letterSpacing:"0.1em", marginBottom:4 }}>{tr.dashboard}</div>
            <div style={{ fontSize:26, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>
              Bonjour, <span style={{ color:"#E30613" }}>{currentUser.name.split(" ")[0]}</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, background:T.surface, border:`1px solid ${T.border}`, color:T.textMuted, fontSize:12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Paris"})}
          </div>
        </div>

        {/* ── KPI CARDS ── Inspired by Gaia: large numbers, horizontal scroll if needed */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:32 }}>
          {[
            { label:tr.kpi_total,  value:tickets.length,               color:"#7A96D4", rgb:"58,95,191",   icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
            { label:tr.kpi_running,       value:counts.running||0,            color:"#12214B", rgb:"251,191,36",  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
            { label:tr.kpi_validate,      value:counts.waiting_validation||0, color:"#F97316", rgb:"249,115,22",  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
            { label:tr.kpi_done,       value:counts.completed||0,          color:"#34D399", rgb:"52,211,153",  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> },
            { label:tr.kpi_rejected, value:(counts.rejected||0)+(counts.error||0), color:"#F87171", rgb:"248,113,113", icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
          ].map(({ label, value, icon, color, rgb },i) => (
            <div key={label} className="kpi-card" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 22px 18px", position:"relative", overflow:"hidden", cursor:"default",
              boxShadow: dark ? `0 0 0 1px rgba(${rgb},0.08)` : "0 2px 16px rgba(18,33,75,0.07)" }}>
              {/* top accent line */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,rgba(${rgb},0),rgba(${rgb},0.8),rgba(${rgb},0))` }} />
              {/* icon top right */}
              <div style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:10, background:`rgba(${rgb},0.1)`, border:`1px solid rgba(${rgb},0.18)`, display:"flex", alignItems:"center", justifyContent:"center", color }}>{icon}</div>
              {/* label */}
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:T.textFaint, marginBottom:12 }}>{label.toUpperCase()}</div>
              {/* big number */}
              <div style={{ fontSize:42, fontWeight:800, lineHeight:1, color: dark ? "#fff" : "#0f172a", letterSpacing:"-0.03em" }}>{value}</div>
              {/* subtle bottom label */}
              <div style={{ marginTop:10, fontSize:10, color:`rgba(${rgb},0.7)`, fontWeight:600 }}>
                {value === 0 ? tr.kpi_none : value === 1 ? `1 ${tr.kpi_one}` : `${value} ${tr.kpi_many}`}
              </div>
            </div>
          ))}
        </div>

        {/* ── TICKETS EN ATTENTE DE VALIDATION — mini section ── */}
        {(counts.waiting_validation||0) > 0 && (
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:4, height:20, borderRadius:2, background:"#F97316" }} />
                <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{tr.filter_validate}</span>
                <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(249,115,22,0.15)", color:"#F97316", fontSize:11, fontWeight:700 }}>{counts.waiting_validation}</span>
              </div>
              <button onClick={()=>setFilter("waiting_validation")} style={{ background:"none", border:"none", color:"#F97316", fontSize:12, fontWeight:600, cursor:"pointer" }}>{tr.see_all}</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:10 }}>
              {tickets.filter(t=>t.status==="waiting_validation").slice(0,3).map(t=>(
                <div key={t.id} onClick={()=>setSelected(t)}
                  style={{ background:T.surface, border:"1px solid rgba(249,115,22,0.25)", borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s",
                    boxShadow: dark?"0 0 0 1px rgba(249,115,22,0.08)":"0 2px 8px rgba(249,115,22,0.08)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{t.vendor}</div>
                      <div style={{ fontSize:11, color:T.textFaint, marginTop:2 }}>{t.project||"—"} · {t.analyst||"—"}</div>
                    </div>
                    <div style={{ padding:"3px 9px", borderRadius:20, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.3)", color:"#F97316", fontSize:10, fontWeight:700 }}>À valider</div>
                  </div>
                  <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
                    <button onClick={e=>{e.stopPropagation();setSelected(t);}}
                      style={{ padding:"5px 12px", borderRadius:7, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.3)", color:"#F97316", cursor:"pointer", fontSize:11, fontWeight:600 }}>
                      Valider →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION HEADER: Tous les tickets ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:4, height:20, borderRadius:2, background:"#E30613" }} />
            <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{tr.filter_all} {tr.kpi_many}</span>
            <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(227,6,19,0.12)", color:"#E30613", fontSize:11, fontWeight:700 }}>{filteredTickets.length}</span>
          </div>
          {/* Filters inline */}
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <div style={{ display:"flex", gap:2, background:T.filterBg, border:`1px solid ${T.border}`, borderRadius:10, padding:3 }}>
              {FILTERS.map(({ key, label, count }) => (
                <button key={key} onClick={() => setFilter(key)} className="filter-tab"
                  style={{ padding:"4px 11px", borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:filter===key?700:400,
                    background:filter===key?"#E30613":"transparent", border:"none",
                    color:filter===key?"#fff":T.filterText, transition:"all 0.15s" }}>
                  {label}{count>0&&filter!==key&&<span style={{ marginLeft:4, fontSize:10, opacity:0.6 }}>{count}</span>}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textFaint, display:"flex", pointerEvents:"none" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr.search_ph}
                style={{ padding:"6px 10px 6px 28px", borderRadius:8, background:T.inputBg, border:`1px solid ${T.inputBorder}`, color:T.inputText, fontSize:11, outline:"none", width:180 }} />
            </div>
          </div>
        </div>

        {/* ── Admin delete bar ── */}
        {isAdmin && someChecked && (
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background: dark?"rgba(227,6,19,0.08)":"#fff0f0", border:"1px solid rgba(227,6,19,0.2)", borderRadius:10, marginBottom:12 }}>
            <span style={{ color:"#E30613", fontSize:12, fontWeight:600 }}>{checkedIds.size} sélectionné{checkedIds.size>1?"s":""}</span>
            <button onClick={()=>setConfirmDelete(true)} disabled={deleting}
              style={{ padding:"4px 12px", borderRadius:7, background:"#E30613", border:"none", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
              Supprimer
            </button>
            <button onClick={()=>setCheckedIds(new Set())} style={{ padding:"4px 10px", borderRadius:7, background:"transparent", border:"1px solid rgba(227,6,19,0.3)", color:"#E30613", cursor:"pointer", fontSize:11 }}>Annuler</button>
          </div>
        )}

        {/* ── TABLE ── */}
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, overflow:"hidden", boxShadow: dark?"none":"0 4px 24px rgba(18,33,75,0.07)" }}>
          {loading ? (
            <div style={{ padding:64, textAlign:"center", color:T.textFaint, fontSize:13 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#E30613", display:"inline-block", animation:"blink 1.4s infinite", marginRight:10 }} />
              {tr.loading}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding:80, textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:18, background:T.surfaceMid, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <div style={{ color:T.textMuted, fontSize:14, fontWeight:500, marginBottom:6 }}>
                {search ? `${tr.no_results} "${search}"` : tr.no_tickets}
              </div>
              <div style={{ color:T.textFaint, fontSize:12, marginBottom:20 }}>Créez votre premier ticket d'analyse</div>
              {!search && <button onClick={()=>setShowUpload(true)}
                style={{ padding:"9px 22px", borderRadius:10, background:"#E30613", border:"none", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                + Nouveau ticket
              </button>}
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background: dark?"rgba(0,0,0,0.3)":"#f8fafc", borderBottom:`1px solid ${T.border}` }}>
                  {isAdmin && <th style={{ padding:"13px 16px", width:40 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>}
                  {[tr.col_vendor,tr.col_analyst,tr.col_decision,tr.col_status,tr.col_date,tr.col_actions].map(h => (
                    <th key={h} style={{ padding:"13px 18px", textAlign:"left", color:T.thText, fontSize:10, fontWeight:700, letterSpacing:"0.12em" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <TicketRow key={t.id} ticket={t}
                    onSelect={setSelected}
                    adminMode={isAdmin}
                    checked={checkedIds.has(t.id)}
                    onCheck={e=>toggleCheck(t.id,e)}
                    dark={dark} T={T} tr={tr}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {search && filteredTickets.length > 0 && (
          <div style={{ marginTop:10, color:T.textFaint, fontSize:12 }}>
            {filteredTickets.length} résultat{filteredTickets.length>1?"s":""} pour « {search} »
          </div>
        )}
      </div>

      {showUpload   && <UploadModal onClose={()=>setShowUpload(false)} onLaunched={id=>{ setShowUpload(false); setTrackingId(id); setLastRefresh(Date.now()); }} />}
      {trackingId   && <LiveTrackingModal ticketId={trackingId} dark={dark} onClose={()=>{ setTrackingId(null); setLastRefresh(Date.now()); }} onRefreshList={()=>setLastRefresh(Date.now())} />}
      {selected     && <DetailModal ticket={selected} onClose={()=>setSelected(null)} onDone={()=>{ setSelected(null); setLastRefresh(Date.now()); }} dark={dark} />}
      {confirmDelete && <ConfirmDeleteModal count={checkedIds.size} onConfirm={deleteSelected} onCancel={()=>setConfirmDelete(false)} tr={tr} />}
    </div>
  );
}