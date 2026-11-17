package com.sportmatch.business.booking;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Réservations de DÉMONSTRATION : aucun paiement n'est demandé ni simulé. */
@RestController
@RequestMapping("/api/v1/business")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @GetMapping("/courts")
    public List<Court> courts(@RequestParam(name = "venueId", required = false) UUID venueId) {
        return service.courts(venueId);
    }

    @GetMapping("/courts/{id}/availability")
    public List<Slot> availability(@PathVariable("id") UUID id,
                                   @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.availability(id, date);
    }

    @PostMapping("/bookings")
    public ResponseEntity<Booking> book(@RequestHeader("X-User-Id") String userId,
                                        @RequestHeader(name = "X-User-Email", required = false) String email,
                                        @Valid @RequestBody CreateBookingRequest request) {
        Booking booking = service.book(userId, email, request);
        return ResponseEntity.created(URI.create("/api/v1/business/bookings/" + booking.id())).body(booking);
    }

    @GetMapping("/bookings/mine")
    public List<Booking> mine(@RequestHeader("X-User-Id") String userId) {
        return service.mine(userId);
    }

    @PostMapping("/bookings/{id}/cancel")
    public Booking cancel(@RequestHeader("X-User-Id") String userId, @PathVariable("id") UUID id) {
        return service.cancel(userId, id);
    }
}
