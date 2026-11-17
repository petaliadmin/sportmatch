package com.sportmatch.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Envoi d'e-mails "best effort" : une panne SMTP n'empêche jamais la notification in-app.
 * En local, les e-mails arrivent dans Mailpit (http://localhost:8025), jamais chez un vrai destinataire.
 */
@Component
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String from;

    public EmailSender(ObjectProvider<JavaMailSender> mailSender,
                       @Value("${sportmatch.mail.enabled:true}") boolean enabled,
                       @Value("${sportmatch.mail.from:no-reply@demo.sportmatch.test}") String from) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.from = from;
    }

    public void send(String to, NewNotification notification) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!enabled || sender == null || to == null || to.isBlank()) {
            return;
        }
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo(to);
        mail.setSubject("SportMatch · " + notification.title());
        mail.setText(notification.body() + "\n\n— L'équipe SportMatch (environnement de démonstration)");
        try {
            sender.send(mail);
        } catch (MailException e) {
            log.warn("E-mail non envoyé à {} : {}", to, e.getMessage());
        }
    }
}
