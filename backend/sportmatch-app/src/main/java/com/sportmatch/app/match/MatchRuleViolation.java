package com.sportmatch.app.match;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** Règle métier non respectée : renvoyée en 409 au format ProblemDetail (RFC 9457). */
public class MatchRuleViolation extends ErrorResponseException {

    public MatchRuleViolation(String detail) {
        super(HttpStatus.CONFLICT, ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail), null);
    }
}
