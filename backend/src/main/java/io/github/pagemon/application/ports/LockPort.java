package io.github.pagemon.application.ports;

public interface LockPort {

    LockHandle tryAcquire(String key);

    interface LockHandle extends AutoCloseable {
        boolean acquired();
        @Override
        void close();
    }

    static LockPort noop() {
        return key -> new LockHandle() {
            @Override
            public boolean acquired() { return true; }
            @Override
            public void close() {

            }
        };
    }
}
