package io.github.pagemon.interfaces.api;

import io.github.pagemon.application.usecases.DeleteTargetUseCase;
import io.github.pagemon.application.usecases.UpdateTargetUseCase;
import io.github.pagemon.domain.exceptions.*;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(TargetNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> targetNotFound(TargetNotFoundException e) {
        return base(e.errorCode().name(), e.getMessage());
    }

    @ExceptionHandler(FetchFailedException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public Map<String, Object> fetchFailed(FetchFailedException e) {
        Map<String, Object> response = base(e.errorCode().name(), e.getMessage());
        if (e.getUrl() != null) {
            response.put("url", e.getUrl().toString());
        }
        if (e.getHttpStatus() != null) {
            response.put("httpStatus", e.getHttpStatus());
        }
        return response;
    }

    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> domainValidation(ValidationException e) {
        Map<String, Object> response = base(e.errorCode().name(), e.getMessage());
        if (e.getField() != null) {
            response.put("field", e.getField());
        }
        return response;
    }

    @ExceptionHandler(ConfigurationException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> configuration(ConfigurationException e) {
        Map<String, Object> response = base(e.errorCode().name(), e.getMessage());
        if (e.getConfigKey() != null) {
            response.put("configKey", e.getConfigKey());
        }
        return response;
    }

    @ExceptionHandler(UpdateTargetUseCase.NotFound.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> notFound(RuntimeException e) {
        return base("NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(DeleteTargetUseCase.NotFound.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> notFoundDelete(RuntimeException e) {
        return base("NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> badRequest(RuntimeException e) {
        return base("BAD_REQUEST", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validation(MethodArgumentNotValidException e) {
        List<Map<String, String>> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage()
                ))
                .toList();

        return Map.of(
                "timestamp", Instant.now().toString(),
                "error", "VALIDATION",
                "message", "Validation failure",
                "errors", errors
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> constraint(ConstraintViolationException e) {
        List<Map<String, String>> errors = e.getConstraintViolations().stream()
                .map(v -> Map.of(
                        "path", v.getPropertyPath() == null ? "" : v.getPropertyPath().toString(),
                        "message", v.getMessage() == null ? "invalid" : v.getMessage()
                ))
                .toList();

        return Map.of(
                "timestamp", Instant.now().toString(),
                "error", "VALIDATION",
                "message", "Validation failure",
                "errors", errors
        );
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> internal(Exception e) {
        return base("INTERNAL_ERROR", e.getMessage());
    }

    private static Map<String, Object> base(String error, String message) {
        return new java.util.HashMap<>(Map.of(
                "timestamp", Instant.now().toString(),
                "error", error,
                "message", message
        ));
    }
}
