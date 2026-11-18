package com.sportmatch.business.pro;

import com.sportmatch.business.pro.ProViews.BlockSlot;
import com.sportmatch.business.pro.ProViews.CreateCourt;
import com.sportmatch.business.pro.ProViews.Dashboard;
import com.sportmatch.business.pro.ProViews.ProBooking;
import com.sportmatch.business.pro.ProViews.ProCourt;
import com.sportmatch.business.pro.ProViews.UpdateCourt;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Espace prestataire. La gateway exige déjà le rôle "provider" ; le service le revérifie (défense en profondeur)
 * et cloisonne toutes les données sur l'identifiant de connexion du prestataire.
 */
@RestController
@RequestMapping("/api/v1/business/pro")
public class ProController {

    private final ProService service;

    public ProController(ProService service) {
        this.service = service;
    }

    static String requireProvider(String login, String roles) {
        boolean provider = roles != null && Arrays.asList(roles.split(",")).contains("provider");
        if (login == null || login.isBlank() || !provider) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Espace réservé aux prestataires");
        }
        return login;
    }

    @GetMapping("/courts")
    public List<ProCourt> courts(@RequestHeader(name = "X-User-Login", required = false) String login,
                                 @RequestHeader(name = "X-User-Roles", required = false) String roles) {
        return service.courts(requireProvider(login, roles));
    }

    @PostMapping("/courts")
    public ResponseEntity<ProCourt> create(@RequestHeader(name = "X-User-Login", required = false) String login,
                                           @RequestHeader(name = "X-User-Roles", required = false) String roles,
                                           @Valid @RequestBody CreateCourt request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(requireProvider(login, roles), request));
    }

    @PatchMapping("/courts/{id}")
    public ProCourt update(@RequestHeader(name = "X-User-Login", required = false) String login,
                           @RequestHeader(name = "X-User-Roles", required = false) String roles,
                           @PathVariable("id") UUID id, @Valid @RequestBody UpdateCourt request) {
        return service.update(requireProvider(login, roles), id, request);
    }

    @GetMapping("/bookings")
    public List<ProBooking> bookings(@RequestHeader(name = "X-User-Login", required = false) String login,
                                     @RequestHeader(name = "X-User-Roles", required = false) String roles,
                                     @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(6) : to;
        return service.bookings(requireProvider(login, roles), start, end);
    }

    @PostMapping("/courts/{id}/blocks")
    public ResponseEntity<ProBooking> block(@RequestHeader(name = "X-User-Login", required = false) String login,
                                            @RequestHeader(name = "X-User-Roles", required = false) String roles,
                                            @RequestHeader("X-User-Id") String userId,
                                            @PathVariable("id") UUID id, @Valid @RequestBody BlockSlot request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.block(requireProvider(login, roles), userId, id, request));
    }

    @DeleteMapping("/blocks/{id}")
    public ResponseEntity<Void> release(@RequestHeader(name = "X-User-Login", required = false) String login,
                                        @RequestHeader(name = "X-User-Roles", required = false) String roles,
                                        @PathVariable("id") UUID id) {
        service.release(requireProvider(login, roles), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard(@RequestHeader(name = "X-User-Login", required = false) String login,
                               @RequestHeader(name = "X-User-Roles", required = false) String roles) {
        return service.dashboard(requireProvider(login, roles));
    }
}
