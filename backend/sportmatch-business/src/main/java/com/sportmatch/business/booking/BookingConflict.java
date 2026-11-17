package com.sportmatch.business.booking;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class BookingConflict extends ErrorResponseException {

    public BookingConflict(HttpStatus status, String detail) {
        super(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    public static BookingConflict conflict(String detail) {
        return new BookingConflict(HttpStatus.CONFLICT, detail);
    }

    public static BookingConflict invalid(String detail) {
        return new BookingConflict(HttpStatus.UNPROCESSABLE_ENTITY, detail);
    }
}
