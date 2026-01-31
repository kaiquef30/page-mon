package io.github.pagemon.infrastructure.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcFilter implements Filter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String TRACE_ID_HEADER = "X-Trace-ID";
    private static final String USER_ID_HEADER = "X-User-ID";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            try {
                String requestId = extractOrGenerateRequestId(httpRequest);
                LoggingContext.put(LoggingContext.REQUEST_ID, requestId);

                httpResponse.setHeader(REQUEST_ID_HEADER, requestId);

                String traceId = httpRequest.getHeader(TRACE_ID_HEADER);
                if (traceId != null) {
                    LoggingContext.put(LoggingContext.TRACE_ID, traceId);
                }

                String userId = httpRequest.getHeader(USER_ID_HEADER);
                if (userId != null) {
                    LoggingContext.put(LoggingContext.USER_ID, userId);
                }

                LoggingContext.put(LoggingContext.HTTP_METHOD, httpRequest.getMethod());
                LoggingContext.put(LoggingContext.URL, getFullURL(httpRequest));
                LoggingContext.put(LoggingContext.THREAD_NAME, Thread.currentThread().getName());

                long startTime = System.currentTimeMillis();

                chain.doFilter(request, response);

                LoggingContext.put(LoggingContext.HTTP_STATUS, httpResponse.getStatus());
                long duration = System.currentTimeMillis() - startTime;
                LoggingContext.setDuration(duration);

            } finally {
                LoggingContext.clear();
            }
        } else {
            chain.doFilter(request, response);
        }
    }

    private String extractOrGenerateRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = LoggingContext.generateRequestId();
        }
        return requestId;
    }

    private String getFullURL(HttpServletRequest request) {
        StringBuilder requestURL = new StringBuilder(request.getRequestURI());
        String queryString = request.getQueryString();

        if (queryString != null) {
            requestURL.append('?').append(queryString);
        }

        return requestURL.toString();
    }
}
