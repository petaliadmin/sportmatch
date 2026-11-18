package com.sportmatch.events.tournament;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class TournamentRuleViolation extends ErrorResponseException {

    public TournamentRuleViolation(HttpStatus status, String detail) {
        super(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    public static TournamentRuleViolation conflict(String detail) {
        return new TournamentRuleViolation(HttpStatus.CONFLICT, detail);
    }

    public static TournamentRuleViolation forbidden(String detail) {
        return new TournamentRuleViolation(HttpStatus.FORBIDDEN, detail);
    }
}
