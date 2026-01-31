package io.github.pagemon.domain.exceptions;

public class ConfigurationException extends DomainException {

    private final String configKey;

    public ConfigurationException(String message) {
        super(message);
        this.configKey = null;
    }

    public ConfigurationException(String configKey, String message) {
        super(message);
        this.configKey = configKey;
    }

    public ConfigurationException(String message, Throwable cause) {
        super(message, cause);
        this.configKey = null;
    }

    public String getConfigKey() {
        return configKey;
    }

    @Override
    public ErrorCode errorCode() {
        return ErrorCode.CONFIGURATION_ERROR;
    }
}
