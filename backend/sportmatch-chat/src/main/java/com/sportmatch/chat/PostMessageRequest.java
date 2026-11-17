package com.sportmatch.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostMessageRequest(@NotBlank @Size(max = 1000) String body) {
}
