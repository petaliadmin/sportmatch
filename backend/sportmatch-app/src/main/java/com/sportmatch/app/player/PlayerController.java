package com.sportmatch.app.player;

import com.sportmatch.app.match.Identity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PlayerController {

    private final PlayerService service;

    public PlayerController(PlayerService service) {
        this.service = service;
    }

    @GetMapping("/me/profile")
    public PlayerProfile me(@RequestHeader(Identity.USER_HEADER) String userId,
                            @RequestHeader(name = Identity.NAME_HEADER, required = false) String name) {
        return service.profile(userId, Identity.decode(name));
    }

    @PutMapping("/me/profile")
    public PlayerProfile update(@RequestHeader(Identity.USER_HEADER) String userId, @Valid @RequestBody UpdateProfile request) {
        return service.update(userId, request);
    }

    /** Profil public d'un joueur (nom, préférences, fiabilité) : visible des joueurs connectés. */
    @GetMapping("/players/{id}")
    public PlayerProfile player(@PathVariable("id") String id) {
        return service.profile(id, null);
    }
}
