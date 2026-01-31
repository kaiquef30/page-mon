package io.github.pagemon.infrastructure.logging;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class LoggingInterceptor implements HandlerInterceptor {

    private static final StructuredLogger log = StructuredLogger.forClass(LoggingInterceptor.class);
    private static final String START_TIME_ATTRIBUTE = "requestStartTime";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());

        if (handler instanceof HandlerMethod handlerMethod) {
            String controllerName = handlerMethod.getBeanType().getSimpleName();
            String methodName = handlerMethod.getMethod().getName();

            LoggingContext.setComponent(controllerName);
            LoggingContext.setOperation(methodName);

            log.debug()
                .message("Request received")
                .component(controllerName)
                .operation(methodName)
                .field("httpMethod", request.getMethod())
                .field("path", request.getRequestURI())
                .field("queryString", request.getQueryString())
                .field("remoteAddr", request.getRemoteAddr())
                .log();
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute(START_TIME_ATTRIBUTE);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            String level = determineLogLevel(status, ex);

            var logBuilder = switch (level) {
                case "error" -> log.error();
                case "warn" -> log.warn();
                default -> log.info();
            };

            logBuilder
                .message("Request completed")
                .field("httpMethod", request.getMethod())
                .field("path", request.getRequestURI())
                .field("httpStatus", status)
                .duration(duration)
                .status(ex != null ? "error" : "success");

            if (ex != null) {
                logBuilder.exception(ex);
            }

            logBuilder.log();
        }
    }

    private String determineLogLevel(int status, Exception ex) {
        if (ex != null || status >= 500) {
            return "error";
        } else if (status >= 400) {
            return "warn";
        } else {
            return "info";
        }
    }
}
